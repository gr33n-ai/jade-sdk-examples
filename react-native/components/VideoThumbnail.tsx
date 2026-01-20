import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import * as VideoThumbnails from 'expo-video-thumbnails';

interface Props {
  videoUri: string;
  style?: ViewStyle;
}

export default function VideoThumbnail({ videoUri, style }: Props) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function generateThumbnail() {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 1000,
        });
        if (mounted) {
          setThumbnailUri(uri);
        }
      } catch (e) {
        if (mounted) {
          setError(true);
        }
      }
    }

    generateThumbnail();

    return () => {
      mounted = false;
    };
  }, [videoUri]);

  if (error || !thumbnailUri) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: thumbnailUri }}
        style={styles.thumbnail}
        contentFit="cover"
      />
      <View style={styles.playOverlay}>
        <Text style={styles.playIconSmall}>▶</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIconSmall: {
    color: '#fff',
    fontSize: 16,
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 20,
  },
});
