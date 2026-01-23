/**
 * Mobile Workflow Graph Builder
 *
 * Builds DAGs from processed conversation entries for mobile visualization.
 * Simplified from web version - no bash parsing, focused on Jade MCP tools.
 */

import type { ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import type {
  MobileWorkflowGraph,
  AssetNode,
  ToolCallNode,
  AssetURI,
  ToolCallNodeURI,
  AssetType,
  CompactGraphData,
  MediaAssetURI,
  TextAssetURI,
} from './types';

// ===== URI Helpers =====

export function isFalMediaUrl(url: string): url is MediaAssetURI {
  return /^https?:\/\/(fal\.media|v3b\.fal\.media)\/files\/.+/i.test(url);
}

export function isTransactionURI(uri: string): uri is TextAssetURI {
  return uri.startsWith('jade://transaction/');
}

export function createToolURI(toolUseId: string): ToolCallNodeURI {
  return `jade://tool/${toolUseId}`;
}

export function createTransactionURI(id: string): TextAssetURI {
  return `jade://transaction/${id}`;
}

export function getAssetType(uri: AssetURI): AssetType {
  if (isTransactionURI(uri)) return 'text_prompt';
  if (uri.startsWith('external://')) return 'external';
  if (/\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(uri)) return 'image';
  if (/\.(mp4|mov|webm|avi)(\?|$)/i.test(uri)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|mpeg|mpg)(\?|$)/i.test(uri)) return 'audio';
  return 'image';
}

// ===== Tool Pattern Registry =====

interface ToolPattern {
  textFields: string[];
  mediaFields: string[];
  multiMediaFields: string[];
}

const TOOL_PATTERNS: Record<string, ToolPattern> = {
  'mcp__jade__generative_image': {
    textFields: ['prompt'],
    mediaFields: ['image_url'],
    multiMediaFields: ['additional_image_urls'],
  },
  'mcp__jade__generative_video': {
    textFields: ['prompt'],
    mediaFields: ['input_url', 'last_frame_url'],
    multiMediaFields: [],
  },
  'mcp__jade__generative_audio': {
    textFields: ['text_input'],
    mediaFields: ['video_url'],
    multiMediaFields: [],
  },
  'mcp__jade__generative_character': {
    textFields: [],
    mediaFields: ['image_url', 'audio_url'],
    multiMediaFields: [],
  },
  'mcp__jade__background_removal': {
    textFields: [],
    mediaFields: ['input_url'],
    multiMediaFields: [],
  },
  'mcp__jade__captions_highlights': {
    textFields: [],
    mediaFields: ['input_url'],
    multiMediaFields: [],
  },
  'mcp__jade__import_media': {
    textFields: [],
    mediaFields: ['source'],
    multiMediaFields: [],
  },
};

const EXCLUDED_TOOLS = new Set([
  'mcp__jade__request_status',
  'Skill',
  'TodoWrite',
  'Read',
  'WebSearch',
  'Write',
  'Edit',
  'Glob',
  'Grep',
]);

function shouldIncludeTool(toolName: string): boolean {
  return toolName in TOOL_PATTERNS && !EXCLUDED_TOOLS.has(toolName);
}

function getToolPattern(toolName: string): ToolPattern | null {
  return TOOL_PATTERNS[toolName] || null;
}

// ===== Extraction Functions =====

function extractToolInputs(
  toolInput: Record<string, unknown>,
  toolName: string,
  toolUseId: string
): { inputs: AssetURI[]; promptTextMap: Map<AssetURI, string> } {
  const pattern = getToolPattern(toolName);
  if (!pattern) return { inputs: [], promptTextMap: new Map() };

  const inputs: AssetURI[] = [];
  const promptTextMap = new Map<AssetURI, string>();

  // Extract text prompts
  pattern.textFields.forEach((fieldName) => {
    const textValue = toolInput[fieldName];
    if (textValue && typeof textValue === 'string' && textValue.trim()) {
      const uri = createTransactionURI(`${toolUseId}/${fieldName}`);
      inputs.push(uri);
      promptTextMap.set(uri, textValue);
    }
  });

  // Extract media URLs
  pattern.mediaFields.forEach((fieldName) => {
    const mediaValue = toolInput[fieldName];
    if (mediaValue && typeof mediaValue === 'string' && mediaValue.trim()) {
      if (isFalMediaUrl(mediaValue)) {
        inputs.push(mediaValue as AssetURI);
      }
    }
  });

  // Extract multi-media URLs
  pattern.multiMediaFields.forEach((fieldName) => {
    const multiValue = toolInput[fieldName];
    let urls: string[] = [];

    if (typeof multiValue === 'string') {
      urls = multiValue.split(',').map((u) => u.trim()).filter(Boolean);
    } else if (Array.isArray(multiValue)) {
      urls = multiValue.filter((u) => typeof u === 'string');
    }

    urls.forEach((url) => {
      if (isFalMediaUrl(url)) {
        inputs.push(url as AssetURI);
      }
    });
  });

  return { inputs, promptTextMap };
}

function extractToolOutputs(parsedResult: Record<string, unknown> | undefined): AssetURI[] {
  if (!parsedResult?.data) return [];

  const data = parsedResult.data as Record<string, unknown>;
  const mediaInfo = data.mediaInfo as { urls?: string[] } | undefined;

  if (mediaInfo?.urls && Array.isArray(mediaInfo.urls)) {
    return mediaInfo.urls.filter((url) => isFalMediaUrl(url)) as AssetURI[];
  }

  return [];
}

function ensureAssetNode(
  graph: MobileWorkflowGraph,
  assetUri: AssetURI,
  initialContent?: string
): void {
  if (graph.assets.has(assetUri)) return;

  const assetType = getAssetType(assetUri);

  const node: AssetNode = {
    id: assetUri,
    type: 'asset',
    assetType,
    metadata: {},
    usedBy: [],
  };

  if (assetType === 'text_prompt') {
    node.content = initialContent || '';
  } else {
    node.url = assetUri as MediaAssetURI;
  }

  graph.assets.set(assetUri, node);
}

// ===== Build Functions =====

/**
 * Build a compact graph for a single tool call
 * Used for inline visualization in chat
 */
export function buildCompactGraph(entry: ProcessedEntry): CompactGraphData | null {
  const toolName = entry.data?.toolName as string | undefined;
  const toolUseId = entry.entry?.tool_use_id as string | undefined;
  const toolInput = entry.parsedInput?.data as Record<string, unknown> | undefined;
  const parsedResult = entry.parsedResult as Record<string, unknown> | undefined;

  if (!toolName || !toolUseId || !shouldIncludeTool(toolName)) {
    return null;
  }

  const toolCallId = createToolURI(toolUseId);
  const { inputs: inputUris, promptTextMap } = extractToolInputs(
    toolInput || {},
    toolName,
    toolUseId
  );
  const outputUris = extractToolOutputs(parsedResult);

  if (inputUris.length === 0 && outputUris.length === 0) {
    return null;
  }

  const inputNodes: AssetNode[] = inputUris.map((uri) => ({
    id: uri,
    type: 'asset' as const,
    assetType: getAssetType(uri),
    content: promptTextMap.get(uri),
    url: isTransactionURI(uri) ? undefined : (uri as MediaAssetURI),
    metadata: {},
    usedBy: [toolCallId],
  }));

  const outputNodes: AssetNode[] = outputUris.map((uri) => ({
    id: uri,
    type: 'asset' as const,
    assetType: getAssetType(uri),
    url: uri as MediaAssetURI,
    metadata: {},
    producedBy: toolCallId,
    usedBy: [],
  }));

  return {
    toolCallId,
    toolName,
    inputs: inputNodes,
    outputs: outputNodes,
    params: (toolInput || {}) as Record<string, unknown>,
  };
}

/**
 * Build full workflow graph from all processed entries
 * Used for full session graph view
 */
export function buildWorkflowGraph(
  entries: ProcessedEntry[],
  sessionId: string
): MobileWorkflowGraph {
  const graph: MobileWorkflowGraph = {
    assets: new Map(),
    toolCalls: new Map(),
    edges: [],
    finalAssets: [],
    metadata: {
      sessionId,
      createdAt: new Date().toISOString(),
      toolCount: 0,
      assetCount: 0,
    },
  };

  // Process each tool call entry
  entries.forEach((entry) => {
    const originalType = entry.originalType;
    if (originalType !== 'tool_call') return;

    const toolName = entry.data?.toolName as string | undefined;
    const toolUseId = entry.entry?.tool_use_id as string | undefined;

    if (!toolName || !toolUseId || !shouldIncludeTool(toolName)) return;

    const toolInput = entry.parsedInput?.data as Record<string, unknown> | undefined;
    const parsedResult = entry.parsedResult as Record<string, unknown> | undefined;

    const toolUri = createToolURI(toolUseId);
    const { inputs, promptTextMap } = extractToolInputs(toolInput || {}, toolName, toolUseId);
    const outputs = extractToolOutputs(parsedResult);

    if (outputs.length === 0) return;

    // Create tool call node
    graph.toolCalls.set(toolUri, {
      id: toolUri,
      type: 'tool_call',
      toolName,
      inputs,
      outputs,
      params: (toolInput || {}) as Record<string, unknown>,
      timestamp: entry.entry?.timestamp || new Date().toISOString(),
    });

    // Create input asset nodes and edges
    inputs.forEach((assetUri, idx) => {
      const promptText = promptTextMap.get(assetUri);
      ensureAssetNode(graph, assetUri, promptText);
      graph.assets.get(assetUri)!.usedBy.push(toolUri);

      graph.edges.push({
        id: `${assetUri}_to_${toolUri}`,
        source: assetUri,
        target: toolUri,
        targetPort: `input-${idx}`,
        type: 'input',
      });
    });

    // Create output asset nodes and edges
    outputs.forEach((assetUri, idx) => {
      ensureAssetNode(graph, assetUri);
      graph.assets.get(assetUri)!.producedBy = toolUri;

      graph.edges.push({
        id: `${toolUri}_to_${assetUri}`,
        source: toolUri,
        target: assetUri,
        sourcePort: `output-${idx}`,
        type: 'output',
      });
    });
  });

  // Identify final assets (outputs with no consumers)
  graph.finalAssets = Array.from(graph.assets.values())
    .filter((asset) => asset.usedBy.length === 0 && asset.producedBy)
    .map((asset) => asset.id);

  // Update metadata
  graph.metadata.toolCount = graph.toolCalls.size;
  graph.metadata.assetCount = graph.assets.size;

  return graph;
}

/**
 * Get the graph data needed to render a single tool call in compact view
 */
export function getToolCallGraphData(
  graph: MobileWorkflowGraph,
  toolCallId: ToolCallNodeURI
): CompactGraphData | null {
  const toolCall = graph.toolCalls.get(toolCallId);
  if (!toolCall) return null;

  const inputs = toolCall.inputs
    .map((uri) => graph.assets.get(uri))
    .filter((node): node is AssetNode => node !== undefined);

  const outputs = toolCall.outputs
    .map((uri) => graph.assets.get(uri))
    .filter((node): node is AssetNode => node !== undefined);

  return {
    toolCallId,
    toolName: toolCall.toolName,
    inputs,
    outputs,
    params: toolCall.params,
  };
}
