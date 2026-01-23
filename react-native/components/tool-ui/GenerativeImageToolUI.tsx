import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import type { ToolUIProps } from './registry';
import { CompactGraphView } from '../workflow-graph';
import { useThemeColors } from '../../utils/theme';
import SpinningLoader from '../SpinningLoader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INPUT_THUMB_SIZE = 40;
const OUTPUT_SIZE = 160;

interface MediaResult {
  urls: string[];
  requestId?: string;
}

interface InputData {
  prompt?: string;
  inputImageUrls?: string[];
  model?: string;
  aspectRatio?: string;
  numImages?: number;
}

export function GenerativeImageToolUI({ entry, onShowFullGraph }: ToolUIProps) {
  const colors = useThemeColors();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  const mediaInfo = entry.parsedResult?.data?.mediaInfo as MediaResult | undefined;
  const inputData = entry.parsedInput?.data as InputData | undefined;

  const isLoading = !mediaInfo?.urls || mediaInfo.urls.length === 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        {inputData?.prompt && (
          <View style={[styles.promptContainer, { borderLeftColor: colors.success }]}>
            <Text style={[styles.promptText, { color: colors.fenceText }]} numberOfLines={4}>
              {inputData.prompt}
            </Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <SpinningLoader size={16} color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Generating image...
          </Text>
        </View>
      </View>
    );
  }

  const urls = mediaInfo.urls;
  const selectedUrl = selectedIndex !== null ? urls[selectedIndex] : null;
  const inputImageUrls = inputData?.inputImageUrls || [];

  return (
    <View style={styles.container}>
      {inputData?.prompt && (
        <View style={[styles.promptContainer, { borderLeftColor: colors.success }]}>
          <Text style={[styles.promptText, { color: colors.fenceText }]} numberOfLines={4}>
            {inputData.prompt}
          </Text>
        </View>
      )}

      <View style={styles.metaRow}>
        {inputData?.model && (
          <View style={[styles.modelBadge, { backgroundColor: colors.accentBackground }]}>
            <Text style={[styles.sparkle, { color: colors.success }]}>✦</Text>
            <Text style={[styles.modelText, { color: colors.success }]}>{inputData.model}</Text>
          </View>
        )}
        {inputImageUrls.length > 0 && (
          <View style={styles.inputThumbs}>
            {inputImageUrls.slice(0, 3).map((url, idx) => (
              <Image
                key={idx}
                source={{ uri: url }}
                style={styles.inputThumb}
                contentFit="cover"
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.outputGrid}>
        {urls.map((url, index) => (
          <TouchableOpacity
            key={index}
            style={styles.outputThumb}
            onPress={() => {
              setIsPromptExpanded(false);
              setSelectedIndex(index);
            }}
          >
            <Image
              source={{ uri: url }}
              style={styles.outputImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Compact Graph View */}
      <CompactGraphView entry={entry} onPress={onShowFullGraph} />

      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedIndex(null)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {selectedUrl && (
            <Image
              source={{ uri: selectedUrl }}
              style={styles.fullImage}
              contentFit="contain"
            />
          )}

          {urls.length > 1 && (
            <View style={styles.navContainer}>
              <TouchableOpacity
                style={[styles.navButton, selectedIndex === 0 && styles.navButtonDisabled]}
                onPress={() => selectedIndex !== null && selectedIndex > 0 && setSelectedIndex(selectedIndex - 1)}
                disabled={selectedIndex === 0}
              >
                <Text style={styles.navText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.navCounter}>
                {(selectedIndex ?? 0) + 1} / {urls.length}
              </Text>
              <TouchableOpacity
                style={[styles.navButton, selectedIndex === urls.length - 1 && styles.navButtonDisabled]}
                onPress={() => selectedIndex !== null && selectedIndex < urls.length - 1 && setSelectedIndex(selectedIndex + 1)}
                disabled={selectedIndex === urls.length - 1}
              >
                <Text style={styles.navText}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mediaInfo}>
            {inputData?.model && (
              <Text style={styles.infoText}>Model: {inputData.model}</Text>
            )}
            {inputData?.aspectRatio && (
              <Text style={styles.infoText}>Aspect: {inputData.aspectRatio}</Text>
            )}
            {inputData?.prompt && (
              <TouchableOpacity
                onPress={() => setIsPromptExpanded(!isPromptExpanded)}
                activeOpacity={0.7}
              >
                <Text
                  style={styles.modalPromptText}
                  numberOfLines={isPromptExpanded ? undefined : 2}
                >
                  {inputData.prompt}
                </Text>
                <Text style={styles.expandHint}>
                  {isPromptExpanded ? 'Tap to collapse' : 'Tap to expand'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  promptContainer: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  sparkle: {
    fontSize: 12,
  },
  modelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputThumbs: {
    flexDirection: 'row',
    gap: 6,
  },
  inputThumb: {
    width: INPUT_THUMB_SIZE,
    height: INPUT_THUMB_SIZE,
    borderRadius: 6,
  },
  outputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outputThumb: {
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  outputImage: {
    width: '100%',
    height: '100%',
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
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  navButton: {
    padding: 16,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navText: {
    color: '#fff',
    fontSize: 32,
  },
  navCounter: {
    color: '#aaa',
    fontSize: 14,
    marginHorizontal: 16,
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
  modalPromptText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
  expandHint: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
