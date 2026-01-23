import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJadeClient, type SessionMetadata } from '@gr33n-ai/jade-sdk-rn-client';
import { useThemeColors } from '../utils/theme';

function ComposeIcon({ size = 20, color = '#007AFF' }: { size?: number; color?: string }) {
  const strokeWidth = 1.5;
  const padding = 2;
  const squareSize = size - padding * 2 - 4;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect
        x={padding}
        y={padding + 4}
        width={squareSize}
        height={squareSize}
        rx={2}
        ry={2}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Line
        x1={size - padding - 3}
        y1={padding + 1}
        x2={size - padding - squareSize + 2}
        y2={padding + squareSize - 1}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export const SIDEBAR_WIDTH = 280;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onManageSkills: () => void;
  onDisconnect: () => void;
  currentSessionId?: string;
}

export default function Sidebar({
  visible,
  onClose,
  onSelectSession,
  onNewSession,
  onManageSkills,
  onDisconnect,
  currentSessionId,
}: SidebarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const client = useJadeClient();

  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (visible && !hasLoadedOnce) {
      loadSessions();
      setHasLoadedOnce(true);
    }
  }, [visible, hasLoadedOnce]);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await client.listSessions();
      setSessions(result.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSessions();
    setIsRefreshing(false);
  }, [loadSessions]);

  const handleDelete = async (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.deleteSession(sessionId);
              setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  const handleRename = async (sessionId: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await client.updateSession(sessionId, { name: editName });
      setSessions((prev) =>
        prev.map((s) => (s.session_id === sessionId ? { ...s, name: editName } : s))
      );
      setEditingId(null);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to rename session');
    }
  };

  const startEditing = (session: SessionMetadata) => {
    setEditingId(session.session_id);
    setEditName(session.name || '');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  const handleNewSession = () => {
    onNewSession();
    onClose();
  };

  if (!visible) return null;

  return (
    <View
      style={[
        styles.sidebarShadow,
        { width: SIDEBAR_WIDTH },
      ]}
    >
      <View
        style={[
          styles.sidebarContent,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            style={[
              styles.composeButton,
              { backgroundColor: colors.accentBackground, borderColor: colors.accent, borderWidth: 1 },
            ]}
            onPress={handleNewSession}
          >
            <ComposeIcon size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.sessionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
        >
          {isLoading && !isRefreshing ? (
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
          ) : sessions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sessions yet</Text>
          ) : (
            sessions.map((session) => (
              <TouchableOpacity
                key={session.session_id}
                style={[
                  styles.sessionItem,
                  currentSessionId === session.session_id && {
                    backgroundColor: colors.accentBackground,
                  },
                ]}
                onPress={() => handleSelectSession(session.session_id)}
                activeOpacity={0.7}
              >
                {editingId === session.session_id ? (
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.background, color: colors.text }]}
                    value={editName}
                    onChangeText={setEditName}
                    onSubmitEditing={() => handleRename(session.session_id)}
                    onBlur={() => handleRename(session.session_id)}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <View style={styles.sessionRow}>
                    <View style={styles.sessionInfo}>
                      <Text
                        style={[
                          styles.sessionName,
                          { color: colors.text },
                          currentSessionId === session.session_id && { color: colors.accent },
                        ]}
                        numberOfLines={1}
                      >
                        {session.name || `Session ${session.session_id.slice(0, 8)}`}
                      </Text>
                      <Text style={[styles.sessionDate, { color: colors.textMuted }]}>
                        {formatDate(session.created_at)}
                      </Text>
                    </View>
                    <View style={styles.sessionActions}>
                      <TouchableOpacity
                        style={styles.inlineAction}
                        onPress={() => startEditing(session)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.inlineActionIcon, { color: colors.textMuted }]}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inlineAction}
                        onPress={() => handleDelete(session.session_id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.inlineActionIcon, { color: colors.textMuted }]}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.footerButton, { backgroundColor: colors.backgroundTertiary }]}
            onPress={() => {
              onManageSkills();
              onClose();
            }}
          >
            <Text style={[styles.footerButtonText, { color: colors.text }]}>Manage Skills</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.disconnectButton]}
            onPress={() => {
              onDisconnect();
              onClose();
            }}
          >
            <Text style={[styles.disconnectText, { color: colors.error }]}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarContent: {
    flex: 1,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSpacer: {
    flex: 1,
  },
  composeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionsList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  sessionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 12,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  inlineAction: {
    padding: 4,
  },
  inlineActionIcon: {
    fontSize: 14,
  },
  editInput: {
    fontSize: 14,
    padding: 8,
    borderRadius: 4,
  },
  footer: {
    padding: 16,
    gap: 8,
  },
  footerButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disconnectButton: {
    backgroundColor: 'transparent',
  },
  disconnectText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
