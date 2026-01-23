/**
 * GraphCanvas - Scrollable/zoomable container for full graph view
 * Uses ScrollView for pan (gesture handler not available)
 */

import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, G } from 'react-native-svg';
import type { LayoutedGraph, LayoutedNode, LayoutedEdge, AssetNode, ToolCallNode } from './types';
import { GRAPH_COLORS } from './types';
import { MobileAssetNode } from './MobileAssetNode';
import { MobileToolNode } from './MobileToolNode';

interface GraphCanvasProps {
  layout: LayoutedGraph;
  onNodePress?: (node: LayoutedNode) => void;
  initialScrollToNode?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

function generateBezierPath(edge: LayoutedEdge, zoom: number): string {
  const [start, end] = edge.points;
  const x1 = start.x * zoom;
  const y1 = start.y * zoom;
  const x2 = end.x * zoom;
  const y2 = end.y * zoom;

  const deltaY = y2 - y1;
  const controlOffset = Math.min(Math.abs(deltaY) * 0.4, 60 * zoom);

  const cx1 = x1;
  const cy1 = y1 + controlOffset;
  const cx2 = x2;
  const cy2 = y2 - controlOffset;

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

export function GraphCanvas({ layout, onNodePress, initialScrollToNode }: GraphCanvasProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [zoom, setZoom] = useState(1);

  const canvasWidth = layout.bounds.width * zoom;
  const canvasHeight = layout.bounds.height * zoom;

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  };

  React.useEffect(() => {
    if (initialScrollToNode && scrollRef.current) {
      const node = layout.nodes.find((n) => n.id === initialScrollToNode);
      if (node) {
        const scrollX = Math.max(0, node.x * zoom - SCREEN_WIDTH / 2 + node.width / 2);
        const scrollY = Math.max(0, node.y * zoom - SCREEN_HEIGHT / 3);
        scrollRef.current.scrollTo({ x: scrollX, y: scrollY, animated: true });
      }
    }
  }, [initialScrollToNode, layout, zoom]);

  const edgePaths = useMemo(() => {
    return layout.edges.map((edge) => ({
      edge,
      path: generateBezierPath(edge, zoom),
      startPoint: { x: edge.points[0].x * zoom, y: edge.points[0].y * zoom },
      endPoint: { x: edge.points[1].x * zoom, y: edge.points[1].y * zoom },
    }));
  }, [layout.edges, zoom]);

  return (
    <View style={styles.container}>
      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={[styles.zoomButton, zoom >= MAX_ZOOM && styles.zoomButtonDisabled]}
          onPress={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.zoomLevel}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity
          style={[styles.zoomButton, zoom <= MIN_ZOOM && styles.zoomButtonDisabled]}
          onPress={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
        >
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        style={styles.scrollView}
        contentContainerStyle={{
          width: canvasWidth,
          height: canvasHeight,
        }}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ScrollView
          contentContainerStyle={{
            width: canvasWidth,
            height: canvasHeight,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            {/* Edges with bezier curves */}
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <LinearGradient id="edgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={GRAPH_COLORS.edgeStart} />
                  <Stop offset="50%" stopColor={GRAPH_COLORS.edgeMid} />
                  <Stop offset="100%" stopColor={GRAPH_COLORS.edgeEnd} />
                </LinearGradient>
                <LinearGradient id="edgeGlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={GRAPH_COLORS.edgeGlow} />
                  <Stop offset="50%" stopColor={GRAPH_COLORS.primary} stopOpacity="0.5" />
                  <Stop offset="100%" stopColor={GRAPH_COLORS.edgeGlow} />
                </LinearGradient>
              </Defs>

              {edgePaths.map(({ edge, path, startPoint, endPoint }) => (
                <G key={edge.id}>
                  {/* Soft glow layer */}
                  <Path
                    d={path}
                    stroke={GRAPH_COLORS.edgeGlow}
                    strokeWidth={8 * zoom}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.3}
                  />

                  {/* Main path with gradient */}
                  <Path
                    d={path}
                    stroke="url(#edgeGradient)"
                    strokeWidth={3 * zoom}
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Connection dot at start */}
                  <Circle
                    cx={startPoint.x}
                    cy={startPoint.y}
                    r={4 * zoom}
                    fill={GRAPH_COLORS.primary}
                    opacity={0.8}
                  />

                  {/* Connection dot at end */}
                  <Circle
                    cx={endPoint.x}
                    cy={endPoint.y}
                    r={4 * zoom}
                    fill={GRAPH_COLORS.secondary}
                    opacity={0.8}
                  />
                </G>
              ))}
            </Svg>

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const nodeStyle = {
                position: 'absolute' as const,
                left: node.x * zoom,
                top: node.y * zoom,
                transform: [{ scale: zoom }],
                transformOrigin: 'top left',
              };

              if (node.type === 'asset') {
                return (
                  <MobileAssetNode
                    key={node.id}
                    node={node.data as AssetNode}
                    onPress={() => onNodePress?.(node)}
                    style={nodeStyle}
                  />
                );
              }

              return (
                <MobileToolNode
                  key={node.id}
                  node={node.data as ToolCallNode}
                  onPress={() => onNodePress?.(node)}
                  style={nodeStyle}
                />
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAPH_COLORS.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  zoomControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 4,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: GRAPH_COLORS.glassBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAPH_COLORS.primary,
  },
  zoomButtonDisabled: {
    opacity: 0.3,
  },
  zoomButtonText: {
    color: GRAPH_COLORS.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  zoomLevel: {
    color: '#fff',
    fontSize: 11,
    paddingVertical: 2,
  },
});

export default GraphCanvas;
