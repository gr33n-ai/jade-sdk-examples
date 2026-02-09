import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { CornerRadius } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';

const THUMBNAIL_SIZE = 56;

interface SourceMediaRowProps {
  urls: string[];
}

export default function SourceMediaRow({ urls }: SourceMediaRowProps) {
  const colors = useThemeColors();
  if (urls.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {urls.map((url) => (
        <View key={url} style={[styles.thumbnail, { backgroundColor: colors.backgroundSecondary }]}>
          <Image
            source={{ uri: url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: CornerRadius.small + 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
