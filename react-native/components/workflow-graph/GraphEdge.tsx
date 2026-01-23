/**
 * GraphEdge - SVG edge with gradient stroke
 */

import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import type { LayoutedEdge, LayoutPosition } from './types';
import { GRAPH_COLORS } from './types';

interface GraphEdgeProps {
  edge: LayoutedEdge;
  compact?: boolean;
}

function createPath(points: LayoutPosition[]): string {
  if (points.length < 2) return '';

  const [start, ...rest] = points;
  let d = `M ${start.x} ${start.y}`;

  if (rest.length === 1) {
    // Simple line
    d += ` L ${rest[0].x} ${rest[0].y}`;
  } else {
    // Curved path through all points
    for (let i = 0; i < rest.length; i++) {
      const curr = rest[i];
      const prev = i === 0 ? start : rest[i - 1];
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }
  }

  return d;
}

export function GraphEdge({ edge, compact = false }: GraphEdgeProps) {
  const path = createPath(edge.points);
  const gradientId = `edge-gradient-${edge.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const strokeWidth = compact ? 2 : 3;

  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={GRAPH_COLORS.edgeStart} />
          <Stop offset="50%" stopColor={GRAPH_COLORS.edgeMid} />
          <Stop offset="100%" stopColor={GRAPH_COLORS.edgeEnd} />
        </LinearGradient>
      </Defs>
      <Path
        d={path}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default GraphEdge;
