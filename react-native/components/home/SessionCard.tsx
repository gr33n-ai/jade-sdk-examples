import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { SessionMetadata } from '@gr33n-ai/jade-sdk-rn-client';
import { CardSize, CornerRadius } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';

interface SessionCardProps {
  session: SessionMetadata;
  imageUrl?: string;
  extraImageUrls?: string[];
  onPress: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
}

function hueFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 30%, 25%)`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export default function SessionCard({
  session,
  imageUrl,
  extraImageUrls,
  onPress,
  onRename,
  onDelete,
}: SessionCardProps) {
  const colors = useThemeColors();
  const gradientColor = useMemo(
    () => hueFromString(session.session_id),
    [session.session_id],
  );

  const handleLongPress = () => {
    const options = [];
    if (onRename) {
      options.push({
        text: 'Rename',
        onPress: () => {
          Alert.prompt?.(
            'Rename Session',
            'Enter a new name',
            (text: string) => {
              if (text.trim()) onRename(text.trim());
            },
            'plain-text',
            session.name || '',
          );
        },
      });
    }
    if (onDelete) {
      options.push({
        text: 'Delete',
        style: 'destructive' as const,
        onPress: onDelete,
      });
    }
    if (options.length > 0) {
      Alert.alert('Session', undefined, [
        { text: 'Cancel', style: 'cancel' },
        ...options,
      ]);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <LinearGradient
          colors={[gradientColor, '#111111']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {extraImageUrls && extraImageUrls.length > 0 && (
          <View style={styles.extraRow}>
            {extraImageUrls.map((url) => (
              <View key={url} style={styles.extraThumb}>
                <Image
                  source={{ uri: url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            ))}
          </View>
        )}
        <Text style={styles.name} numberOfLines={2}>
          {session.name || `Session ${session.session_id.slice(0, 8)}`}
        </Text>
        <Text style={styles.date}>{formatDate(session.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CardSize.sessionHeight,
    borderRadius: CornerRadius.medium,
    overflow: 'hidden',
    flex: 1,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  extraRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  extraThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
