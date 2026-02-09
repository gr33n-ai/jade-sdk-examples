import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MediaInfo } from '@gr33n-ai/jade-sdk-rn-client';
import PageIndicator from './PageIndicator';
import ModelBadge from './ModelBadge';

interface MediaViewerProps {
  media: MediaInfo[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaViewer({ media, initialIndex, onClose }: MediaViewerProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<MediaInfo>>(null);

  const handleScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number }; layoutMeasurement: { width: number } } }) => {
      const pageWidth = e.nativeEvent.layoutMeasurement.width;
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / pageWidth);
      if (index >= 0 && index < media.length) {
        setActiveIndex(index);
      }
    },
    [media.length],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth],
  );

  const currentMedia = media[activeIndex];

  const renderMedia = (item: MediaInfo) => {
    if (item.type === 'video') {
      return (
        <Video
          source={{ uri: item.url }}
          style={{ width: screenWidth, height: screenHeight }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          useNativeControls
        />
      );
    }

    return (
      <Image
        source={{ uri: item.url }}
        style={{ width: screenWidth, height: screenHeight }}
        contentFit="contain"
        transition={200}
      />
    );
  };

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.backdrop}>
        {media.length === 1 ? (
          <View style={styles.singleMedia}>
            {renderMedia(media[0])}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={media}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={handleScrollEnd}
            keyExtractor={(item) => item.url}
            renderItem={({ item }) => (
              <View style={{ width: screenWidth, height: screenHeight, justifyContent: 'center', alignItems: 'center' }}>
                {renderMedia(item)}
              </View>
            )}
          />
        )}

        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 12 }]}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {media.length > 1 && (
            <PageIndicator count={media.length} activeIndex={activeIndex} />
          )}
          {currentMedia?.model && (
            <View style={styles.badgeRow}>
              <ModelBadge model={currentMedia.model} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  singleMedia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
