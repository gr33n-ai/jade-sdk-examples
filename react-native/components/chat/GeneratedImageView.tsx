import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { MediaInfo } from '@gr33n-ai/jade-sdk-rn-client';
import ModelBadge from './ModelBadge';
import { CornerRadius, CardSize } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';
import { useVideoThumbnail } from '../../hooks/useVideoThumbnail';

interface GeneratedImageViewProps {
  media: MediaInfo;
  onPress?: () => void;
  height?: number;
}

export default function GeneratedImageView({
  media,
  onPress,
  height = CardSize.mediaHeight,
}: GeneratedImageViewProps) {
  const colors = useThemeColors();
  const isVideo = media.type === 'video';
  const videoThumbnail = useVideoThumbnail(isVideo ? media.url : undefined);
  const imageSource = isVideo && videoThumbnail ? videoThumbnail : media.url;

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        if (onPress) runOnJS(onPress)();
      }),
    [onPress],
  );

  const content = (
    <View style={[styles.container, { height }]}>
      {isVideo && !videoThumbnail ? (
        <View style={[styles.image, styles.videoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      ) : (
        <Image
          source={{ uri: imageSource }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={300}
        />
      )}

      {isVideo && (
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
      )}

      <View style={styles.badgeContainer}>
        <ModelBadge model={media.model} />
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <GestureDetector gesture={tapGesture}>
      {content}
    </GestureDetector>
  );
}

export function GeneratedImagePlaceholder({ height = CardSize.mediaHeight }: { height?: number }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, styles.placeholder, { height, backgroundColor: colors.backgroundSecondary }]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: CornerRadius.medium,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 18,
    color: '#000',
    marginLeft: 3,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
