/**
 * MobileToolNode - Full-size tool node for full graph view (160x80)
 * Enhanced with glass-morphic styling and animations
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle, Line } from 'react-native-svg';
import type { ToolCallNode } from './types';
import { GRAPH_COLORS } from './types';
import { FULL_TOOL_WIDTH, FULL_TOOL_HEIGHT } from './mobile-layout';
import { usePulseAnimation, useGridFlowAnimation } from './animations';

interface MobileToolNodeProps {
  node: ToolCallNode;
  onPress?: () => void;
  style?: object;
}

const TOOL_ICONS: Record<string, string> = {
  'mcp__jade__generative_image': '✦',
  'mcp__jade__generative_video': '▶',
  'mcp__jade__generative_audio': '♫',
  'mcp__jade__generative_character': '👤',
  'mcp__jade__background_removal': '✂',
  'mcp__jade__captions_highlights': '💬',
  'mcp__jade__import_media': '↓',
  default: '⚙',
};

const TOOL_LABELS: Record<string, string> = {
  'mcp__jade__generative_image': 'Image Gen',
  'mcp__jade__generative_video': 'Video Gen',
  'mcp__jade__generative_audio': 'Audio Gen',
  'mcp__jade__generative_character': 'Character',
  'mcp__jade__background_removal': 'Bg Remove',
  'mcp__jade__captions_highlights': 'Captions',
  'mcp__jade__import_media': 'Import',
  default: 'Tool',
};

const GENERATIVE_TOOLS = new Set([
  'mcp__jade__generative_image',
  'mcp__jade__generative_video',
  'mcp__jade__generative_audio',
  'mcp__jade__generative_character',
]);

function getToolIcon(toolName: string): string {
  return TOOL_ICONS[toolName] || TOOL_ICONS.default;
}

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] || formatToolName(toolName);
}

function formatToolName(toolName: string): string {
  const parts = toolName.split('__');
  const name = parts[parts.length - 1] || toolName;
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .slice(0, 12);
}

function isGenerativeTool(toolName: string): boolean {
  return GENERATIVE_TOOLS.has(toolName);
}

const GRID_SIZE = 20;

export function MobileToolNode({ node, onPress, style }: MobileToolNodeProps) {
  const icon = getToolIcon(node.toolName);
  const label = getToolLabel(node.toolName);
  const isGenerative = isGenerativeTool(node.toolName);

  const primaryColor = isGenerative ? GRAPH_COLORS.primary : GRAPH_COLORS.secondary;
  const glowColor = isGenerative ? GRAPH_COLORS.toolPrimaryGlow : GRAPH_COLORS.toolSecondaryGlow;

  const pulseOpacity = usePulseAnimation(0.3, 0.7, 2000);
  const gridOffset = useGridFlowAnimation(GRID_SIZE, 4000);

  const modelParam = (node.params?.model || node.params?.model_id) as string | undefined;
  const paramCount = Object.keys(node.params || {}).length;

  const gridLines = useMemo(() => {
    const lines = [];
    const count = Math.ceil((FULL_TOOL_WIDTH + FULL_TOOL_HEIGHT) / GRID_SIZE) + 2;
    for (let i = 0; i < count; i++) {
      lines.push(i * GRID_SIZE);
    }
    return lines;
  }, []);

  const content = (
    <View style={[styles.wrapper, style]}>
      {/* Outer glow pulse */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            backgroundColor: glowColor,
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Main container */}
      <View style={[styles.container, { borderColor: primaryColor }]}>
        {/* Animated grid background */}
        <Animated.View
          style={[
            styles.gridContainer,
            {
              transform: [
                { translateX: gridOffset },
                { translateY: gridOffset },
              ],
            },
          ]}
        >
          <Svg
            width={FULL_TOOL_WIDTH + GRID_SIZE * 2}
            height={FULL_TOOL_HEIGHT + GRID_SIZE * 2}
            style={{ position: 'absolute', top: -GRID_SIZE, left: -GRID_SIZE }}
          >
            {gridLines.map((pos, i) => (
              <React.Fragment key={`grid-${i}`}>
                <Line
                  x1={pos}
                  y1={0}
                  x2={pos}
                  y2={FULL_TOOL_HEIGHT + GRID_SIZE * 2}
                  stroke={GRAPH_COLORS.toolGridLine}
                  strokeWidth={1}
                />
                <Line
                  x1={0}
                  y1={pos}
                  x2={FULL_TOOL_WIDTH + GRID_SIZE * 2}
                  y2={pos}
                  stroke={GRAPH_COLORS.toolGridLine}
                  strokeWidth={1}
                />
              </React.Fragment>
            ))}
          </Svg>
        </Animated.View>

        {/* Circuit trace decoration */}
        <Svg
          width={FULL_TOOL_WIDTH}
          height={FULL_TOOL_HEIGHT}
          style={styles.circuitTrace}
        >
          <Defs>
            <LinearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={primaryColor} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          <Path
            d="M0,20 L20,20 L20,40 M140,60 L160,60"
            stroke="url(#circuitGrad)"
            strokeWidth={1}
            fill="none"
          />
          <Circle cx={20} cy={40} r={2} fill={primaryColor} opacity={0.5} />
          <Circle cx={140} cy={60} r={2} fill={primaryColor} opacity={0.5} />
        </Svg>

        {/* Inner gradient overlay */}
        <View style={styles.gradientOverlay}>
          <Svg width={FULL_TOOL_WIDTH} height={FULL_TOOL_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="toolInnerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.15" />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={FULL_TOOL_WIDTH} height={FULL_TOOL_HEIGHT} fill="url(#toolInnerGlow)" />
          </Svg>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: `${primaryColor}20`, borderColor: primaryColor }]}>
              <Text style={[styles.icon, { color: primaryColor }]}>{icon}</Text>
            </View>
            <Text style={[styles.label, { color: primaryColor }]}>{label}</Text>
          </View>

          {modelParam ? (
            <View style={styles.paramRow}>
              <Text style={[styles.paramLabel, { color: GRAPH_COLORS.secondary }]}>model:</Text>
              <Text style={styles.paramText} numberOfLines={1}>
                {formatModelName(String(modelParam))}
              </Text>
              {paramCount > 1 && (
                <Text style={styles.paramCount}>+{paramCount - 1}</Text>
              )}
            </View>
          ) : (
            <View style={styles.paramRow}>
              <Text style={styles.paramText}>{paramCount} params</Text>
            </View>
          )}

          <View style={styles.ioRow}>
            <View style={[styles.ioBadge, { borderColor: GRAPH_COLORS.primary }]}>
              <Text style={[styles.ioText, { color: GRAPH_COLORS.primary }]}>
                {node.inputs.length} in
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={[styles.ioBadge, { borderColor: GRAPH_COLORS.secondary }]}>
              <Text style={[styles.ioText, { color: GRAPH_COLORS.secondary }]}>
                {node.outputs.length} out
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom edge highlight */}
        <View style={[styles.bottomEdge, { backgroundColor: primaryColor }]} />
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function formatModelName(model: string): string {
  if (model.length <= 15) return model;
  const parts = model.split('/');
  if (parts.length > 1) {
    return parts[parts.length - 1].slice(0, 15);
  }
  return model.slice(0, 12) + '...';
}

const styles = StyleSheet.create({
  wrapper: {
    width: FULL_TOOL_WIDTH + 16,
    height: FULL_TOOL_HEIGHT + 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: FULL_TOOL_WIDTH + 20,
    height: FULL_TOOL_HEIGHT + 20,
    borderRadius: 16,
  },
  container: {
    width: FULL_TOOL_WIDTH,
    height: FULL_TOOL_HEIGHT,
    borderRadius: 12,
    backgroundColor: GRAPH_COLORS.backgroundLight,
    borderWidth: 2,
    overflow: 'hidden',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circuitTrace: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paramLabel: {
    fontSize: 9,
    fontWeight: '500',
    opacity: 0.8,
  },
  paramText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  paramCount: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
  },
  ioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ioBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  ioText: {
    fontSize: 9,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  bottomEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
});

export default MobileToolNode;
