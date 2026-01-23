/**
 * CompactAssetNode - 60x60 thumbnail for compact graph view
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { AssetNode } from './types';
import { getAssetColor, getAssetGlowColor } from './types';
import { COMPACT_NODE_SIZE } from './mobile-layout';

interface CompactAssetNodeProps {
  node: AssetNode;
  style?: object;
}

export function CompactAssetNode({ node, style }: CompactAssetNodeProps) {
  const color = getAssetColor(node.assetType);
  const glowColor = getAssetGlowColor(node.assetType);

  const isMedia = node.assetType === 'image' || node.assetType === 'video';
  const isAudio = node.assetType === 'audio';
  const isText = node.assetType === 'text_prompt';

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: color,
          shadowColor: glowColor,
        },
        style,
      ]}
    >
      {isMedia && node.url && (
        <Image
          source={{ uri: node.url }}
          style={styles.image}
          contentFit="cover"
        />
      )}

      {isAudio && (
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Text style={[styles.icon, { color }]}>♫</Text>
        </View>
      )}

      {isText && (
        <View style={[styles.textContainer, { backgroundColor: `${color}15` }]}>
          <Text style={[styles.promptIcon, { color }]}>✦</Text>
          <Text style={[styles.promptPreview, { color }]} numberOfLines={2}>
            {node.content?.slice(0, 30)}
          </Text>
        </View>
      )}

      {node.assetType === 'external' && (
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Text style={[styles.icon, { color }]}>↗</Text>
        </View>
      )}

      {node.assetType === 'video' && (
        <View style={styles.videoBadge}>
          <Text style={styles.videoBadgeText}>▶</Text>
        </View>
      )}
    </View>
  );
}

// Re-export the size constant
export { COMPACT_NODE_SIZE } from './mobile-layout';

const styles = StyleSheet.create({
  container: {
    width: COMPACT_NODE_SIZE,
    height: COMPACT_NODE_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#0A0B0F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    padding: 6,
    justifyContent: 'center',
  },
  promptIcon: {
    fontSize: 10,
    marginBottom: 2,
  },
  promptPreview: {
    fontSize: 8,
    lineHeight: 10,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 10,
  },
});

export default CompactAssetNode;
