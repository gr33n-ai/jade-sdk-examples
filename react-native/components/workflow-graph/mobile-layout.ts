/**
 * Mobile DAG Layout Algorithm
 *
 * Simple top-to-bottom DAG layout optimized for mobile screens.
 * No external dependencies (no ELK.js).
 */

import type {
  MobileWorkflowGraph,
  CompactGraphData,
  LayoutedGraph,
  LayoutedNode,
  LayoutedEdge,
  LayoutPosition,
  AssetNode,
  ToolCallNode,
} from './types';

// ===== Layout Constants =====

export const COMPACT_NODE_SIZE = 60;
export const COMPACT_TOOL_WIDTH = 48;
export const COMPACT_TOOL_HEIGHT = 48;
export const COMPACT_SPACING = 16;
export const COMPACT_EDGE_PADDING = 8;

export const FULL_ASSET_SIZE = 120;
export const FULL_TOOL_WIDTH = 160;
export const FULL_TOOL_HEIGHT = 80;
export const FULL_HORIZONTAL_SPACING = 40;
export const FULL_VERTICAL_SPACING = 60;

// ===== Compact Layout (Horizontal Strip) =====

export interface CompactLayout {
  nodes: LayoutedNode[];
  edges: LayoutedEdge[];
  width: number;
  height: number;
}

/**
 * Layout a compact graph for inline display
 * Horizontal strip: [Inputs] → [Tool] → [Outputs]
 */
export function layoutCompactGraph(data: CompactGraphData): CompactLayout {
  const nodes: LayoutedNode[] = [];
  const edges: LayoutedEdge[] = [];

  let currentX = 0;

  // Layout input nodes (stacked if multiple)
  const inputHeight = data.inputs.length * COMPACT_NODE_SIZE +
    Math.max(0, data.inputs.length - 1) * COMPACT_EDGE_PADDING;
  const inputStartY = Math.max(0, (COMPACT_TOOL_HEIGHT - inputHeight) / 2);

  data.inputs.forEach((input, idx) => {
    nodes.push({
      id: input.id,
      type: 'asset',
      x: currentX,
      y: inputStartY + idx * (COMPACT_NODE_SIZE + COMPACT_EDGE_PADDING),
      width: COMPACT_NODE_SIZE,
      height: COMPACT_NODE_SIZE,
      data: input,
    });
  });

  if (data.inputs.length > 0) {
    currentX += COMPACT_NODE_SIZE + COMPACT_SPACING;
  }

  // Layout tool node
  const toolY = Math.max(
    0,
    (inputHeight - COMPACT_TOOL_HEIGHT) / 2 + inputStartY
  );
  const toolNode: LayoutedNode = {
    id: data.toolCallId,
    type: 'tool_call',
    x: currentX,
    y: toolY,
    width: COMPACT_TOOL_WIDTH,
    height: COMPACT_TOOL_HEIGHT,
    data: {
      id: data.toolCallId,
      type: 'tool_call',
      toolName: data.toolName,
      inputs: data.inputs.map((n) => n.id),
      outputs: data.outputs.map((n) => n.id),
      params: data.params,
      timestamp: new Date().toISOString(),
    } as ToolCallNode,
  };
  nodes.push(toolNode);

  const toolCenterX = currentX + COMPACT_TOOL_WIDTH / 2;
  const toolCenterY = toolY + COMPACT_TOOL_HEIGHT / 2;

  currentX += COMPACT_TOOL_WIDTH + COMPACT_SPACING;

  // Layout output nodes (side by side if multiple)
  const outputTotalWidth =
    data.outputs.length * COMPACT_NODE_SIZE +
    Math.max(0, data.outputs.length - 1) * COMPACT_EDGE_PADDING;

  data.outputs.forEach((output, idx) => {
    nodes.push({
      id: output.id,
      type: 'asset',
      x: currentX + idx * (COMPACT_NODE_SIZE + COMPACT_EDGE_PADDING),
      y: Math.max(0, (COMPACT_TOOL_HEIGHT - COMPACT_NODE_SIZE) / 2 + toolY),
      width: COMPACT_NODE_SIZE,
      height: COMPACT_NODE_SIZE,
      data: output,
    });
  });

  // Create edges from inputs to tool
  data.inputs.forEach((input, idx) => {
    const inputNode = nodes.find((n) => n.id === input.id)!;
    edges.push({
      id: `${input.id}_to_${data.toolCallId}`,
      source: input.id,
      target: data.toolCallId,
      targetPort: `input-${idx}`,
      type: 'input',
      points: [
        { x: inputNode.x + COMPACT_NODE_SIZE, y: inputNode.y + COMPACT_NODE_SIZE / 2 },
        { x: toolNode.x, y: toolCenterY },
      ],
    });
  });

  // Create edges from tool to outputs
  data.outputs.forEach((output, idx) => {
    const outputNode = nodes.find((n) => n.id === output.id)!;
    edges.push({
      id: `${data.toolCallId}_to_${output.id}`,
      source: data.toolCallId,
      target: output.id,
      sourcePort: `output-${idx}`,
      type: 'output',
      points: [
        { x: toolNode.x + COMPACT_TOOL_WIDTH, y: toolCenterY },
        { x: outputNode.x, y: outputNode.y + COMPACT_NODE_SIZE / 2 },
      ],
    });
  });

  const totalHeight = Math.max(
    inputHeight,
    COMPACT_TOOL_HEIGHT,
    COMPACT_NODE_SIZE
  );

  return {
    nodes,
    edges,
    width: currentX + outputTotalWidth,
    height: totalHeight,
  };
}

// ===== Full Graph Layout (Vertical DAG) =====

interface LayerAssignment {
  [nodeId: string]: number;
}

/**
 * Assign layers to nodes using topological sort
 * Inputs at top, outputs at bottom
 */
function assignLayers(graph: MobileWorkflowGraph): LayerAssignment {
  const layers: LayerAssignment = {};
  const visited = new Set<string>();

  // BFS from root assets
  const queue: { id: string; layer: number }[] = [];

  // Start with assets that have no producer (inputs)
  graph.assets.forEach((asset) => {
    if (!asset.producedBy) {
      queue.push({ id: asset.id, layer: 0 });
      layers[asset.id] = 0;
    }
  });

  while (queue.length > 0) {
    const { id, layer } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    // Process tool calls that use this asset
    const asset = graph.assets.get(id as any);
    if (asset) {
      asset.usedBy.forEach((toolUri) => {
        const toolLayer = layer + 1;
        if (!layers[toolUri] || layers[toolUri] < toolLayer) {
          layers[toolUri] = toolLayer;
        }
        queue.push({ id: toolUri, layer: toolLayer });

        // Process outputs of this tool
        const tool = graph.toolCalls.get(toolUri);
        if (tool) {
          tool.outputs.forEach((outputUri) => {
            const outputLayer = toolLayer + 1;
            if (!layers[outputUri] || layers[outputUri] < outputLayer) {
              layers[outputUri] = outputLayer;
            }
            queue.push({ id: outputUri, layer: outputLayer });
          });
        }
      });
    }

    // Process outputs if this is a tool
    const tool = graph.toolCalls.get(id as any);
    if (tool) {
      tool.outputs.forEach((outputUri) => {
        const outputLayer = layer + 1;
        if (!layers[outputUri] || layers[outputUri] < outputLayer) {
          layers[outputUri] = outputLayer;
        }
        queue.push({ id: outputUri, layer: outputLayer });
      });
    }
  }

  return layers;
}

/**
 * Layout full workflow graph in vertical DAG format
 */
export function layoutFullGraph(graph: MobileWorkflowGraph): LayoutedGraph {
  const layers = assignLayers(graph);
  const nodes: LayoutedNode[] = [];
  const edges: LayoutedEdge[] = [];

  // Group nodes by layer
  const nodesByLayer: Map<number, string[]> = new Map();
  Object.entries(layers).forEach(([nodeId, layer]) => {
    if (!nodesByLayer.has(layer)) {
      nodesByLayer.set(layer, []);
    }
    nodesByLayer.get(layer)!.push(nodeId);
  });

  // Calculate positions for each layer
  const maxLayer = Math.max(...Object.values(layers), 0);
  const nodePositions: Map<string, LayoutPosition> = new Map();

  for (let layer = 0; layer <= maxLayer; layer++) {
    const nodesInLayer = nodesByLayer.get(layer) || [];
    const layerY = layer * (FULL_ASSET_SIZE + FULL_VERTICAL_SPACING);

    // Calculate total width of this layer
    let totalWidth = 0;
    nodesInLayer.forEach((nodeId) => {
      const isAsset = graph.assets.has(nodeId as any);
      const nodeWidth = isAsset ? FULL_ASSET_SIZE : FULL_TOOL_WIDTH;
      totalWidth += nodeWidth;
    });
    totalWidth += Math.max(0, nodesInLayer.length - 1) * FULL_HORIZONTAL_SPACING;

    // Center nodes horizontally
    let currentX = -totalWidth / 2;

    nodesInLayer.forEach((nodeId) => {
      const isAsset = graph.assets.has(nodeId as any);
      const nodeWidth = isAsset ? FULL_ASSET_SIZE : FULL_TOOL_WIDTH;
      const nodeHeight = isAsset ? FULL_ASSET_SIZE : FULL_TOOL_HEIGHT;

      nodePositions.set(nodeId, {
        x: currentX + nodeWidth / 2,
        y: layerY + nodeHeight / 2,
      });

      const asset = graph.assets.get(nodeId as any);
      const tool = graph.toolCalls.get(nodeId as any);

      if (asset) {
        nodes.push({
          id: nodeId,
          type: 'asset',
          x: currentX,
          y: layerY,
          width: nodeWidth,
          height: nodeHeight,
          data: asset,
        });
      } else if (tool) {
        nodes.push({
          id: nodeId,
          type: 'tool_call',
          x: currentX,
          y: layerY,
          width: nodeWidth,
          height: nodeHeight,
          data: tool,
        });
      }

      currentX += nodeWidth + FULL_HORIZONTAL_SPACING;
    });
  }

  // Create edges
  graph.edges.forEach((edge) => {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);

    if (!sourcePos || !targetPos) return;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    // Create path points (simple vertical connection)
    const points: LayoutPosition[] = [
      { x: sourceNode.x + sourceNode.width / 2, y: sourceNode.y + sourceNode.height },
      { x: targetNode.x + targetNode.width / 2, y: targetNode.y },
    ];

    edges.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourcePort: edge.sourcePort,
      targetPort: edge.targetPort,
      type: edge.type,
      points,
    });
  });

  // Calculate bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + node.width);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y + node.height);
  });

  // Normalize positions (shift to positive coordinates)
  const offsetX = -minX + FULL_HORIZONTAL_SPACING;
  const offsetY = -minY + FULL_VERTICAL_SPACING;

  nodes.forEach((node) => {
    node.x += offsetX;
    node.y += offsetY;
  });

  edges.forEach((edge) => {
    edge.points.forEach((point) => {
      point.x += offsetX;
      point.y += offsetY;
    });
  });

  return {
    nodes,
    edges,
    bounds: {
      width: maxX - minX + FULL_HORIZONTAL_SPACING * 2,
      height: maxY - minY + FULL_VERTICAL_SPACING * 2,
    },
  };
}
