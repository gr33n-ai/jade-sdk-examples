/**
 * CompactGraphView - Horizontal strip showing inputs → tool → outputs
 * Renders inline after tool results in chat
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import type { ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import { buildCompactGraph } from './mobile-graph-builder';
import { layoutCompactGraph, COMPACT_NODE_SIZE, COMPACT_TOOL_WIDTH, COMPACT_SPACING } from './mobile-layout';
import { GRAPH_COLORS } from './types';
import { CompactAssetNode } from './CompactAssetNode';
import { CompactToolNode } from './CompactToolNode';

interface CompactGraphViewProps {
  entry: ProcessedEntry;
  onPress?: () => void;
}

export function CompactGraphView({ entry, onPress }: CompactGraphViewProps) {
  const graphData = useMemo(() => buildCompactGraph(entry), [entry]);
  const layout = useMemo(
    () => (graphData ? layoutCompactGraph(graphData) : null),
    [graphData]
  );

  if (!graphData || !layout || (graphData.inputs.length === 0 && graphData.outputs.length === 0)) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, { width: layout.width, height: layout.height }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Edges */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="compactEdgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={GRAPH_COLORS.edgeStart} />
            <Stop offset="50%" stopColor={GRAPH_COLORS.edgeMid} />
            <Stop offset="100%" stopColor={GRAPH_COLORS.edgeEnd} />
          </LinearGradient>
        </Defs>
        {layout.edges.map((edge) => {
          const [start, end] = edge.points;
          return (
            <Line
              key={edge.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="url(#compactEdgeGradient)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>

      {/* Input Nodes */}
      {layout.nodes
        .filter((n) => n.type === 'asset' && graphData.inputs.some((i) => i.id === n.id))
        .map((node) => {
          const assetData = graphData.inputs.find((i) => i.id === node.id);
          if (!assetData) return null;
          return (
            <CompactAssetNode
              key={node.id}
              node={assetData}
              style={{ position: 'absolute', left: node.x, top: node.y }}
            />
          );
        })}

      {/* Tool Node */}
      {layout.nodes
        .filter((n) => n.type === 'tool_call')
        .map((node) => (
          <CompactToolNode
            key={node.id}
            toolName={graphData.toolName}
            style={{ position: 'absolute', left: node.x, top: node.y }}
          />
        ))}

      {/* Output Nodes */}
      {layout.nodes
        .filter((n) => n.type === 'asset' && graphData.outputs.some((o) => o.id === n.id))
        .map((node) => {
          const assetData = graphData.outputs.find((o) => o.id === node.id);
          if (!assetData) return null;
          return (
            <CompactAssetNode
              key={node.id}
              node={assetData}
              style={{ position: 'absolute', left: node.x, top: node.y }}
            />
          );
        })}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 4,
    position: 'relative',
  },
});

export default CompactGraphView;
