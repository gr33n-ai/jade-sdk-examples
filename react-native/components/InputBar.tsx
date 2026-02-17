import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ActionSheetIOS,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeColors } from '../utils/theme';

interface PendingAttachment {
  localUri: string;
  cdnUrl?: string;
  isUploading: boolean;
}

interface InputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  onAttachment?: (uri: string, type: 'image' | 'document') => void;
  pendingAttachment?: PendingAttachment | null;
  onClearAttachment?: () => void;
}

export default function InputBar({
  value,
  onChangeText,
  onSend,
  onCancel,
  isStreaming,
  disabled = false,
  onAttachment,
  pendingAttachment,
  onClearAttachment,
}: InputBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isStreaming) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isStreaming, pulseAnim]);

  const handleAttachmentPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Photo Library', 'Take Photo', 'Files'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await pickImage();
          } else if (buttonIndex === 2) {
            await takePhoto();
          } else if (buttonIndex === 3) {
            await pickDocument();
          }
        }
      );
    } else {
      Alert.alert('Add Attachment', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Files', onPress: pickDocument },
      ]);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to photos to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      onAttachment?.(result.assets[0].uri, 'image');
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      onAttachment?.(result.assets[0].uri, 'image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        onAttachment?.(result.assets[0].uri, 'document');
      }
    } catch (err) {
      console.error('Document picker error:', err);
    }
  };

  const handleSendOrCancel = () => {
    if (isStreaming) {
      onCancel();
    } else if (value.trim() || pendingAttachment?.cdnUrl) {
      onSend();
    }
  };

  const canSend = value.trim().length > 0 || !!pendingAttachment?.cdnUrl;

  return (
    <View style={[styles.outerContainer, { paddingBottom: insets.bottom + 8 }]}>
      {pendingAttachment && (
        <View style={styles.attachmentPreview}>
          <View style={styles.attachmentThumb}>
            <Image source={{ uri: pendingAttachment.localUri }} style={styles.thumbImage} />
            {pendingAttachment.isUploading && (
              <View style={styles.thumbOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            <TouchableOpacity style={styles.thumbRemove} onPress={onClearAttachment}>
              <Text style={styles.thumbRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.container}>
      <TouchableOpacity
        style={[styles.plusButton, { backgroundColor: '#FFFFFF' }]}
        onPress={handleAttachmentPress}
        disabled={isStreaming || disabled}
      >
        <Text style={[styles.plusIcon, { color: colors.textMuted }]}>+</Text>
      </TouchableOpacity>

      <View style={[styles.inputCapsule, { backgroundColor: '#FFFFFF' }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder="Message Jade"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={10000}
          editable={!isStreaming && !disabled}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: colors.accentBackground,
              opacity: canSend || isStreaming ? 1 : 0.4,
            },
          ]}
          onPress={handleSendOrCancel}
          disabled={!canSend && !isStreaming}
        >
          {isStreaming ? (
            <Animated.View style={[styles.stopIndicator, { opacity: pulseAnim }]}>
              <View style={[styles.stopSquare, { backgroundColor: colors.accent }]} />
            </Animated.View>
          ) : (
            <Text style={[styles.sendArrow, { color: colors.accent }]}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  attachmentPreview: {
    paddingHorizontal: 68,
    paddingTop: 8,
  },
  attachmentThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  thumbImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  thumbRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbRemoveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -1,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  plusIcon: {
    fontSize: 24,
    fontWeight: '300',
  },
  inputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
    maxHeight: 120,
    minHeight: 28,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -4,
  },
  sendArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  stopIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
