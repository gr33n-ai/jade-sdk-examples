import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useJadeSession, useJadeClient, type SessionMetadata, type ConversationEntry } from '@gr33n-ai/jade-sdk-rn-client';
import type { RootStackParamList } from '../types/navigation';
import type { TemplatePresentation } from '../types/TemplatePresentation';
import HomeScreen from './home/HomeScreen';
import CardStackChat from './chat/CardStackChat';
import { useThemeColors } from '../utils/theme';
import { useSessionMedia } from '../hooks/useSessionMedia';
import type { ToolCallNodeURI } from './workflow-graph';

interface PendingPrompt {
  prompt: string;
  skills: string[];
}

type Props = NativeStackScreenProps<RootStackParamList, 'Main'> & {
  onDisconnect: () => void;
  pendingPromptRef?: React.MutableRefObject<PendingPrompt | null>;
};

type ChatMode =
  | { type: 'home' }
  | { type: 'chat'; sessionId?: string; initialPrompt?: string; initialSkills?: string[] };

export default function MainScreen({ navigation, route, onDisconnect, pendingPromptRef }: Props) {
  const colors = useThemeColors();
  const client = useJadeClient();
  const session = useJadeSession();

  const [mode, setMode] = useState<ChatMode>(
    route.params?.sessionId
      ? { type: 'chat', sessionId: route.params.sessionId }
      : { type: 'home' },
  );
  const [showFullGraph, setShowFullGraph] = useState(false);
  const [focusToolCallId, setFocusToolCallId] = useState<ToolCallNodeURI | undefined>();

  // Lifted sessions state
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Conversation cache keyed by sessionId
  const conversationCacheRef = useRef<Map<string, ConversationEntry[]>>(new Map());
  const hasLoadedSessionsRef = useRef(false);

  const sessionMediaMap = useSessionMedia(sessions, conversationCacheRef);

  const loadSessions = useCallback(async () => {
    console.log('[MainScreen] loadSessions called');
    try {
      if (!hasLoadedSessionsRef.current) {
        setSessionsLoading(true);
      }
      const result = await client.listSessions();
      console.log('[MainScreen] listSessions response', result.sessions.map(s => ({ id: s.session_id, name: s.name })));
      setSessions(result.sessions);
      hasLoadedSessionsRef.current = true;
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateConversationCache = useCallback((sessionId: string, entries: ConversationEntry[]) => {
    conversationCacheRef.current.set(sessionId, entries);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (pendingPromptRef?.current) {
        const { prompt, skills } = pendingPromptRef.current;
        pendingPromptRef.current = null;
        session.clear();
        setMode({ type: 'chat', initialPrompt: prompt, initialSkills: skills });
      }
    });
    return unsubscribe;
  }, [navigation, pendingPromptRef, session.clear]);

  const handleTemplatePress = useCallback((template: TemplatePresentation) => {
    navigation.navigate('TemplateDetail', { template });
  }, [navigation]);

  const handleSessionPress = useCallback((sessionId: string) => {
    session.clear();
    setMode({ type: 'chat', sessionId });
  }, [session.clear]);

  const handleNewChat = useCallback((prompt: string) => {
    session.clear();
    setMode({ type: 'chat', initialPrompt: prompt });
  }, [session.clear]);

  const handleRenameSession = useCallback(async (sessionId: string, newName: string) => {
    console.log('[MainScreen] handleRenameSession called', { sessionId, newName });
    try {
      const result = await client.updateSession(sessionId, { name: newName });
      console.log('[MainScreen] updateSession response', result);
      setSessions(prev => {
        const next = prev.map(s =>
          s.session_id === sessionId ? { ...s, name: newName } : s
        );
        console.log('[MainScreen] sessions after rename', next.map(s => ({ id: s.session_id, name: s.name })));
        return next;
      });
    } catch (err) {
      console.error('[MainScreen] updateSession failed', err);
    }
  }, [client]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    console.log('[MainScreen] handleDeleteSession called', { sessionId });
    try {
      const result = await client.deleteSession(sessionId);
      console.log('[MainScreen] deleteSession response', result);
      setSessions(prev => {
        const next = prev.filter(s => s.session_id !== sessionId);
        console.log('[MainScreen] sessions after delete', next.map(s => ({ id: s.session_id, name: s.name })));
        return next;
      });
    } catch (err) {
      console.error('[MainScreen] deleteSession failed', err);
    }
  }, [client]);

  const handleBack = useCallback(() => {
    session.clear();
    setMode({ type: 'home' });
    loadSessions();
  }, [session.clear, loadSessions]);

  const handleShowFullGraph = useCallback((toolUseId?: string) => {
    if (toolUseId) {
      setFocusToolCallId(`jade://tool/${toolUseId}` as ToolCallNodeURI);
    } else {
      setFocusToolCallId(undefined);
    }
    setShowFullGraph(true);
  }, []);

  const handleCloseFullGraph = useCallback(() => setShowFullGraph(false), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {mode.type === 'home' ? (
        <HomeScreen
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          sessionMediaMap={sessionMediaMap}
          onRefreshSessions={loadSessions}
          onTemplatePress={handleTemplatePress}
          onSessionPress={handleSessionPress}
          onNewChat={handleNewChat}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
        />
      ) : (
        <CardStackChat
          key={mode.sessionId || 'new-chat'}
          sessionId={mode.sessionId}
          initialPrompt={mode.initialPrompt}
          initialSkills={mode.initialSkills}
          cachedConversation={mode.sessionId ? conversationCacheRef.current.get(mode.sessionId) : undefined}
          onConversationLoaded={updateConversationCache}
          onBack={handleBack}
          onShowFullGraph={handleShowFullGraph}
          showFullGraph={showFullGraph}
          onCloseFullGraph={handleCloseFullGraph}
          focusToolCallId={focusToolCallId}
          session={session}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
