import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useJadeClient, type SessionMetadata } from '@gr33n-ai/jade-sdk-rn-client';
import type { TabParamList } from '../types/navigation';

type NavigationProp = BottomTabNavigationProp<TabParamList>;

export default function SessionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const client = useJadeClient();
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await client.listSessions();
      setSessions(result.sessions);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSessions();
    });
    return unsubscribe;
  }, [navigation, loadSessions]);

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

  const handleSelectSession = (sessionId: string) => {
    navigation.navigate('Chat', { sessionId });
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

  const renderItem = ({ item }: { item: SessionMetadata }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => handleSelectSession(item.session_id)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionContent}>
        {editingId === item.session_id ? (
          <TextInput
            style={styles.editInput}
            value={editName}
            onChangeText={setEditName}
            onSubmitEditing={() => handleRename(item.session_id)}
            onBlur={() => handleRename(item.session_id)}
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <>
            <Text style={styles.sessionName} numberOfLines={1}>
              {item.name || `Session ${item.session_id.slice(0, 8)}`}
            </Text>
            <Text style={styles.sessionMeta}>
              {formatDate(item.created_at)}
            </Text>
          </>
        )}
      </View>
      <View style={styles.sessionActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => startEditing(item)}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item.session_id)}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => item.session_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadSessions}
            tintColor="#4a9eff"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sessions yet</Text>
              <Text style={styles.emptyHint}>Start a conversation to create one</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sessionContent: {
    flex: 1,
  },
  sessionName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  sessionMeta: {
    color: '#888',
    fontSize: 12,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  editInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    padding: 8,
    color: '#fff',
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 4,
  },
  emptyHint: {
    color: '#555',
    fontSize: 14,
  },
});
