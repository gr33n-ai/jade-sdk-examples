import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SessionMetadata } from '@gr33n-ai/jade-sdk-rn-client';
import TemplateCard from './TemplateCard';
import SessionCard from './SessionCard';
import InputBar from '../InputBar';
import { useTemplates } from '../../hooks/useTemplates';
import { Spacing } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';
import type { TemplatePresentation } from '../../types/TemplatePresentation';
import type { SessionMediaInfo } from '../../hooks/useSessionMedia';

interface HomeScreenProps {
  sessions: SessionMetadata[];
  sessionsLoading: boolean;
  sessionMediaMap?: Map<string, SessionMediaInfo>;
  onRefreshSessions: () => Promise<void>;
  onTemplatePress: (template: TemplatePresentation) => void;
  onSessionPress: (sessionId: string) => void;
  onNewChat: (prompt: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function HomeScreen({
  sessions,
  sessionsLoading,
  sessionMediaMap,
  onRefreshSessions,
  onTemplatePress,
  onSessionPress,
  onNewChat,
  onRenameSession,
  onDeleteSession,
}: HomeScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { templates, isLoading: templatesLoading, refresh: refreshTemplates } = useTemplates();
  const [refreshing, setRefreshing] = useState(false);
  const [input, setInput] = useState('');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshTemplates(), onRefreshSessions()]);
    setRefreshing(false);
  }, [refreshTemplates, onRefreshSessions]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    onNewChat(text);
  };

  const templateCardWidth =
    (screenWidth - Spacing.screenPadding * 2 - Spacing.gridGap) / 2;

  // Pair templates into rows of 2 for the horizontal scroll
  const templatePairs: TemplatePresentation[][] = [];
  for (let i = 0; i < templates.length; i += 2) {
    templatePairs.push(templates.slice(i, i + 2));
  }

  // Session grid in 2 columns
  const sessionPairs: SessionMetadata[][] = [];
  for (let i = 0; i < sessions.length; i += 2) {
    sessionPairs.push(sessions.slice(i, i + 2));
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            What would you like to{' '}
          </Text>
          <Text style={[styles.titleItalic, { color: colors.text }]}>
            create
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>?</Text>
        </View>

        {/* Templates Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          Start from a template
        </Text>

        <FlatList
          horizontal
          data={templatePairs}
          keyExtractor={(_, i) => `pair-${i}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templateList}
          renderItem={({ item: pair }) => (
            <View style={[styles.templateColumn, { gap: Spacing.gridGap }]}>
              {pair.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPress={() => onTemplatePress(template)}
                  width={templateCardWidth}
                />
              ))}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.gridGap }} />}
        />

        {/* Sessions Section */}
        {sessions.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionHeader,
                styles.sessionsHeader,
                { color: colors.textSecondary },
              ]}
            >
              Or pick up where you left off
            </Text>

            {sessionPairs.map((pair, rowIndex) => (
              <View
                key={`row-${rowIndex}`}
                style={[styles.sessionRow, { gap: Spacing.gridGap }]}
              >
                {pair.map((session) => {
                  const mediaInfo = sessionMediaMap?.get(session.session_id);
                  return (
                    <SessionCard
                      key={session.session_id}
                      session={session}
                      imageUrl={mediaInfo?.heroUrl}
                      extraImageUrls={mediaInfo?.extraUrls}
                      onPress={() => onSessionPress(session.session_id)}
                      onRename={(name) => onRenameSession(session.session_id, name)}
                      onDelete={() => onDeleteSession(session.session_id)}
                    />
                  );
                })}
                {pair.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Input bar at bottom */}
      <View style={styles.inputBarWrapper}>
        <InputBar
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          onCancel={() => {}}
          isStreaming={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  titleItalic: {
    fontSize: 28,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sectionGap,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionsHeader: {
    marginTop: 28,
  },
  templateList: {
    paddingRight: Spacing.screenPadding,
  },
  templateColumn: {
    flexDirection: 'column',
  },
  sessionRow: {
    flexDirection: 'row',
    marginBottom: Spacing.gridGap,
  },
  inputBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
