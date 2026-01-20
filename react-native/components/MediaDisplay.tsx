import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import type { MediaInfo } from '@gr33n-ai/jade-sdk-rn-client';
import VideoThumbnail from './VideoThumbnail';

interface Props {
  media: MediaInfo[];
}

const THUMBNAIL_SIZE = 60;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MediaDisplay({ media }: Props) {
  const [selectedMedia, setSelectedMedia] = useState<MediaInfo | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  if (media.length === 0) {
    return null;
  }

  const images = media.filter((m) => m.type === 'image');
  const videos = media.filter((m) => m.type === 'video');

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {images.map((item, index) => (
          <TouchableOpacity
            key={`img-${index}`}
            style={styles.thumbnail}
            onPress={() => {
              setIsPromptExpanded(false);
              setSelectedMedia(item);
            }}
          >
            <Image
              source={{ uri: item.url }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        ))}
        {videos.map((item, index) => (
          <TouchableOpacity
            key={`vid-${index}`}
            style={styles.thumbnail}
            onPress={() => {
              setIsPromptExpanded(false);
              setSelectedMedia(item);
            }}
          >
            <VideoThumbnail videoUri={item.url} />
          </TouchableOpacity>
        ))}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {images.length > 0 && `${images.length} img`}
            {images.length > 0 && videos.length > 0 && ' · '}
            {videos.length > 0 && `${videos.length} vid`}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedMedia(null)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {selectedMedia?.type === 'image' && (
            <Image
              source={{ uri: selectedMedia.url }}
              style={styles.fullImage}
              contentFit="contain"
            />
          )}

          {selectedMedia?.type === 'video' && (
            <Video
              source={{ uri: selectedMedia.url }}
              style={styles.fullVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          )}

          {selectedMedia && (
            <View style={styles.mediaInfo}>
              {selectedMedia.model && (
                <Text style={styles.infoText}>Model: {selectedMedia.model}</Text>
              )}
              {selectedMedia.prompt && (
                <TouchableOpacity
                  onPress={() => setIsPromptExpanded(!isPromptExpanded)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={styles.infoText}
                    numberOfLines={isPromptExpanded ? undefined : 2}
                  >
                    Prompt: {selectedMedia.prompt}
                  </Text>
                  <Text style={styles.expandHint}>
                    {isPromptExpanded ? 'Tap to collapse' : 'Tap to expand'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  countBadge: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    color: '#888',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
  },
  fullImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.6,
  },
  fullVideo: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.5,
  },
  mediaInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
  },
  infoText: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  expandHint: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
