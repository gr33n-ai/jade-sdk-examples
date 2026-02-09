import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import type { MediaInfo } from '@gr33n-ai/jade-sdk-rn-client';
import GeneratedImageView from './GeneratedImageView';
import PageIndicator from './PageIndicator';
import { CardSize, Spacing } from '../../utils/designConstants';

interface MediaCarouselProps {
  media: MediaInfo[];
  onTap?: (index: number) => void;
  onIndexChange?: (index: number) => void;
  initialIndex?: number;
  height?: number;
}

export default function MediaCarousel({
  media,
  onTap,
  onIndexChange,
  initialIndex = 0,
  height = CardSize.mediaHeight,
}: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const { width: screenWidth } = useWindowDimensions();
  const pageWidth = screenWidth - Spacing.screenPadding * 2 - Spacing.cardPadding * 2;
  const flatListRef = useRef<FlatList<MediaInfo>>(null);

  const handleScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number }; layoutMeasurement: { width: number } } }) => {
      const w = e.nativeEvent.layoutMeasurement.width;
      const idx = Math.round(e.nativeEvent.contentOffset.x / w);
      if (idx >= 0 && idx < media.length && idx !== activeIndex) {
        setActiveIndex(idx);
        onIndexChange?.(idx);
      }
    },
    [media.length, activeIndex, onIndexChange],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth],
  );

  if (media.length === 0) return null;

  if (media.length === 1) {
    return (
      <GeneratedImageView
        media={media[0]}
        onPress={() => onTap?.(0)}
        height={height}
      />
    );
  }

  return (
    <View>
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
        renderItem={({ item, index }) => (
          <View style={{ width: pageWidth }}>
            <GeneratedImageView
              media={item}
              onPress={() => onTap?.(index)}
              height={height}
            />
          </View>
        )}
      />
      <PageIndicator count={media.length} activeIndex={activeIndex} />
    </View>
  );
}
