/**
 * Mobile Workflow Graph Types
 *
 * Adapted from apps/web/lib/workflow-graph/types.ts for React Native.
 * Simplified for mobile-first DAG visualization.
 */

// ===== Asset URI Types =====

export type MediaAssetURI =
  | `https://fal.media/files/${string}`
  | `https://v3b.fal.media/files/${string}`;

export type TextAssetURI = `jade://transaction/${string}`;
export type ExternalAssetURI = `external://${string}`;
export type LocalFileURI = string;
export type AssetURI = MediaAssetURI | TextAssetURI | ExternalAssetURI | LocalFileURI;
export type ToolCallNodeURI = `jade://tool/${string}`;
export type AssetType = 'text_prompt' | 'image' | 'video' | 'audio' | 'external';

// ===== Graph Nodes =====

export interface AssetNode {
  id: AssetURI;
  type: 'asset';
  assetType: AssetType;
  url?: MediaAssetURI | ExternalAssetURI;
  content?: string;
  metadata: {
    filename?: string;
    size?: number;
    width?: number;
    height?: number;
    duration?: number;
    mimeType?: string;
  };
  producedBy?: ToolCallNodeURI;
  usedBy: ToolCallNodeURI[];
}

export interface ToolCallNode {
  id: ToolCallNodeURI;
  type: 'tool_call';
  toolName: string;
  inputs: AssetURI[];
  outputs: AssetURI[];
  params: Record<string, unknown>;
  timestamp: string;
  description?: string;
}

export interface GraphEdge {
  id: string;
  source: AssetURI | ToolCallNodeURI;
  target: AssetURI | ToolCallNodeURI;
  sourcePort?: string;
  targetPort?: string;
  type: 'input' | 'output';
}

// ===== Mobile Workflow Graph =====

export interface MobileWorkflowGraph {
  assets: Map<AssetURI, AssetNode>;
  toolCalls: Map<ToolCallNodeURI, ToolCallNode>;
  edges: GraphEdge[];
  rootAsset?: AssetURI;
  finalAssets: AssetURI[];
  metadata: {
    sessionId: string;
    createdAt: string;
    toolCount: number;
    assetCount: number;
  };
}

// ===== Layout Types =====

export interface LayoutPosition {
  x: number;
  y: number;
}

export interface LayoutedNode {
  id: string;
  type: 'asset' | 'tool_call';
  x: number;
  y: number;
  width: number;
  height: number;
  data: AssetNode | ToolCallNode;
}

export interface LayoutedEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  type: 'input' | 'output';
  points: LayoutPosition[];
}

export interface LayoutedGraph {
  nodes: LayoutedNode[];
  edges: LayoutedEdge[];
  bounds: {
    width: number;
    height: number;
  };
}

// ===== Compact View Types =====

export interface CompactGraphData {
  toolCallId: ToolCallNodeURI;
  toolName: string;
  inputs: AssetNode[];
  outputs: AssetNode[];
  params: Record<string, unknown>;
}

// ===== Color Theme =====

export const GRAPH_COLORS = {
  // Core palette
  primary: '#00FFB2',
  secondary: '#00D9FF',
  purple: '#B084FF',
  magenta: '#FF00E5',
  amber: '#FFB800',

  // Backgrounds
  backgroundDark: '#050508',
  backgroundLight: '#0A0B0F',
  glassBackground: 'rgba(255,255,255,0.08)',

  // Glass effect colors
  glassGradientStart: 'rgba(255,255,255,0.15)',
  glassGradientEnd: 'rgba(255,255,255,0.02)',
  glassBorder: 'rgba(255,255,255,0.1)',
  glassShimmer: 'rgba(255,255,255,0.3)',

  // Asset-specific colors
  textPrompt: '#00FFB2',
  textPromptGlow: 'rgba(0,255,178,0.6)',
  textPromptBorder: 'rgba(0,255,178,0.4)',
  image: '#00D9FF',
  imageGlow: 'rgba(0,217,255,0.6)',
  imageBorder: 'rgba(0,217,255,0.4)',
  video: '#00D9FF',
  videoGlow: 'rgba(0,217,255,0.6)',
  videoBorder: 'rgba(0,217,255,0.4)',
  audio: '#00FFD0',
  audioGlow: 'rgba(0,255,208,0.6)',
  audioBorder: 'rgba(0,255,208,0.4)',
  external: '#FFB800',
  externalGlow: 'rgba(255,184,0,0.6)',
  externalBorder: 'rgba(255,184,0,0.4)',

  // Tool node colors
  toolPrimaryGlow: 'rgba(0,255,178,0.5)',
  toolSecondaryGlow: 'rgba(0,217,255,0.5)',
  toolGridLine: 'rgba(0,255,178,0.08)',
  toolCircuitLine: 'rgba(0,255,178,0.3)',

  // Edge gradient
  edgeStart: 'rgba(0,255,178,0.4)',
  edgeMid: 'rgba(0,255,178,0.9)',
  edgeEnd: 'rgba(0,255,178,0.4)',
  edgeGlow: 'rgba(0,255,178,0.3)',
} as const;

export function getAssetColor(assetType: AssetType): string {
  switch (assetType) {
    case 'text_prompt':
      return GRAPH_COLORS.textPrompt;
    case 'image':
    case 'video':
      return GRAPH_COLORS.image;
    case 'audio':
      return GRAPH_COLORS.audio;
    case 'external':
      return GRAPH_COLORS.external;
    default:
      return GRAPH_COLORS.secondary;
  }
}

export function getAssetGlowColor(assetType: AssetType): string {
  switch (assetType) {
    case 'text_prompt':
      return GRAPH_COLORS.textPromptGlow;
    case 'image':
    case 'video':
      return GRAPH_COLORS.imageGlow;
    case 'audio':
      return GRAPH_COLORS.audioGlow;
    case 'external':
      return GRAPH_COLORS.externalGlow;
    default:
      return GRAPH_COLORS.imageGlow;
  }
}

export function getAssetBorderColor(assetType: AssetType): string {
  switch (assetType) {
    case 'text_prompt':
      return GRAPH_COLORS.textPromptBorder;
    case 'image':
    case 'video':
      return GRAPH_COLORS.imageBorder;
    case 'audio':
      return GRAPH_COLORS.audioBorder;
    case 'external':
      return GRAPH_COLORS.externalBorder;
    default:
      return GRAPH_COLORS.imageBorder;
  }
}

export function hasGraphData(graph: MobileWorkflowGraph): boolean {
  return graph.toolCalls.size > 0 && graph.assets.size > 0;
}
