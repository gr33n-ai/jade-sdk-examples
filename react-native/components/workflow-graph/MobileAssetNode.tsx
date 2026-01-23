/**
 * MobileAssetNode - Full-size asset node for full graph view (120x120)
 * Enhanced with glass-morphic styling and animations
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, RadialGradient, Stop, Rect, LinearGradient } from 'react-native-svg';
import type { AssetNode } from './types';
import { getAssetColor, getAssetGlowColor, GRAPH_COLORS } from './types';
import { FULL_ASSET_SIZE } from './mobile-layout';
import { usePulseAnimation, useShimmerAnimation } from './animations';

interface MobileAssetNodeProps {
  node: AssetNode;
  onPress?: () => void;
  style?: object;
}

export function MobileAssetNode({ node, onPress, style }: MobileAssetNodeProps) {
  const color = getAssetColor(node.assetType);
  const glowColor = getAssetGlowColor(node.assetType);

  const isMedia = node.assetType === 'image' || node.assetType === 'video';
  const isAudio = node.assetType === 'audio';
  const isText = node.assetType === 'text_prompt';

  const pulseOpacity = usePulseAnimation(0.25, 0.6, 2500);
  const shimmerTranslate = useShimmerAnimation(FULL_ASSET_SIZE, 3500);

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
      <View style={[styles.container, { borderColor: color }]}>
        {/* Inner glow gradient overlay */}
        <View style={styles.innerGlowContainer}>
          <Svg width={FULL_ASSET_SIZE} height={FULL_ASSET_SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="innerGlow" cx="50%" cy="0%" rx="80%" ry="60%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={color} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={FULL_ASSET_SIZE} height={FULL_ASSET_SIZE} fill="url(#innerGlow)" />
          </Svg>
        </View>

        {/* Content layer */}
        <View style={styles.contentLayer}>
          {isMedia && node.url && (
            <Image
              source={{ uri: node.url }}
              style={styles.image}
              contentFit="cover"
            />
          )}

          {isAudio && (
            <View style={[styles.iconContainer, { backgroundColor: `${color}10` }]}>
              <Text style={[styles.icon, { color }]}>♫</Text>
              <Text style={[styles.label, { color }]}>Audio</Text>
            </View>
          )}

          {isText && (
            <View style={[styles.textContainer, { backgroundColor: `${color}08` }]}>
              <Text style={[styles.promptIcon, { color }]}>✦</Text>
              <Text style={[styles.promptText, { color }]} numberOfLines={5}>
                {node.content}
              </Text>
            </View>
          )}

          {node.assetType === 'external' && (
            <View style={[styles.iconContainer, { backgroundColor: `${color}10` }]}>
              <Text style={[styles.icon, { color }]}>↗</Text>
              <Text style={[styles.label, { color }]}>External</Text>
            </View>
          )}

          {node.assetType === 'video' && node.url && (
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>▶</Text>
            </View>
          )}
        </View>

        {/* Shimmer effect overlay */}
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={60} height={FULL_ASSET_SIZE} style={{ opacity: 0.4 }}>
            <Defs>
              <LinearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="transparent" />
                <Stop offset="50%" stopColor={GRAPH_COLORS.glassShimmer} />
                <Stop offset="100%" stopColor="transparent" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="60" height={FULL_ASSET_SIZE} fill="url(#shimmer)" />
          </Svg>
        </Animated.View>

        {/* Bottom edge highlight */}
        <View style={[styles.bottomEdge, { backgroundColor: color }]} />

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: `${color}20`, borderColor: color }]}>
          <Text style={[styles.typeBadgeText, { color }]}>
            {getTypeLabel(node.assetType)}
          </Text>
        </View>
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

function getTypeLabel(type: string): string {
  switch (type) {
    case 'text_prompt':
      return 'Prompt';
    case 'image':
      return 'Image';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'external':
      return 'Import';
    default:
      return 'Asset';
  }
}

const styles = StyleSheet.create({
  wrapper: {
    width: FULL_ASSET_SIZE + 16,
    height: FULL_ASSET_SIZE + 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: FULL_ASSET_SIZE + 24,
    height: FULL_ASSET_SIZE + 24,
    borderRadius: 20,
  },
  container: {
    width: FULL_ASSET_SIZE,
    height: FULL_ASSET_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: GRAPH_COLORS.backgroundLight,
  },
  innerGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  contentLayer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  textContainer: {
    flex: 1,
    padding: 10,
  },
  promptIcon: {
    fontSize: 14,
    marginBottom: 4,
  },
  promptText: {
    fontSize: 11,
    lineHeight: 14,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -60,
    bottom: 0,
  },
  bottomEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 14,
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default MobileAssetNode;
