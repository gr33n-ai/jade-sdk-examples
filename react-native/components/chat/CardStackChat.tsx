import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { type UseJadeSessionReturn, type ConversationEntry, type MediaInfo, useJadeClient } from '@gr33n-ai/jade-sdk-rn-client';
import CardStack from './CardStack';
import ChatCard from './ChatCard';
import PromptRow from './PromptRow';
import ToolCallRow from './ToolCallRow';
import MediaViewer from './MediaViewer';
import ProcessingBlob from './ProcessingBlob';
import InputBar from '../InputBar';
import { FullGraphView, type ToolCallNodeURI } from '../workflow-graph';
import { useConversationTurns } from '../../hooks/useConversationTurns';
import { Spacing } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';
import { getHumanReadableToolName } from '../../utils/toolNames';
import {
  HIDDEN_PROMPT_PREFIX,
  buildMessageContext,
} from '../../utils/promptMetadata';
import { getTodoState, type ConversationTurn } from '../../types/ConversationTurn';

interface CardStackChatProps {
  sessionId?: string;
  initialPrompt?: string;
  initialSkills?: string[];
  cachedConversation?: ConversationEntry[];
  onConversationLoaded?: (sessionId: string, entries: ConversationEntry[]) => void;
  onBack: () => void;
  onShowFullGraph?: (toolUseId?: string) => void;
  showFullGraph?: boolean;
  onCloseFullGraph?: () => void;
  focusToolCallId?: ToolCallNodeURI;
  session: UseJadeSessionReturn;
}

function ProcessingCard({
  turn,
}: {
  turn: ConversationTurn;
}) {
  const lastToolRaw =
    turn.toolCalls.length > 0
      ? (turn.toolCalls[turn.toolCalls.length - 1]?.data?.toolName as string) || ''
      : '';
  const isLastToolTodo = lastToolRaw === 'TodoWrite';
  const todoState = getTodoState(turn);

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <ChatCard>
        {turn.displayPrompt.length > 0 && (
          <PromptRow text={turn.displayPrompt} />
        )}

        {todoState && (
          <ToolCallRow
            toolName="Tasks"
            state={{ type: 'todo', completed: todoState.completed, total: todoState.total }}
          />
        )}

        {turn.toolCalls.length === 0 && !todoState && (
          <ToolCallRow toolName="Thinking" state={{ type: 'inProgress' }} />
        )}

        {turn.toolCalls.length > 0 && !isLastToolTodo && (
          <ToolCallRow
            toolName={getHumanReadableToolName(lastToolRaw || 'Processing')}
            state={{ type: 'inProgress' }}
          />
        )}

        {turn.error && (
          <ToolCallRow
            toolName="Error"
            state={{ type: 'failed', message: turn.error }}
          />
        )}
      </ChatCard>
    </Animated.View>
  );
}

export default function CardStackChat({
  sessionId,
  initialPrompt,
  initialSkills,
  cachedConversation,
  onConversationLoaded,
  onBack,
  onShowFullGraph,
  showFullGraph,
  onCloseFullGraph,
  focusToolCallId,
  session,
}: CardStackChatProps) {
  const client = useJadeClient();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const [viewerMedia, setViewerMedia] = useState<{ media: MediaInfo[]; index: number } | null>(null);
  const [mediaIndexMap, setMediaIndexMap] = useState<Record<string, number>>({});
  const [pendingAttachment, setPendingAttachment] = useState<{
    localUri: string;
    cdnUrl?: string;
    isUploading: boolean;
  } | null>(null);

  const {
    processedConversation,
    media,
    isStreaming,
    streamingText,
    sendMessage,
    cancel,
    loadSession,
    setConversation,
    clear,
    conversation,
    sessionId: hookSessionId,
  } = session;

  const { stackTurns, processingTurns } = useConversationTurns(
    processedConversation,
    media,
    isStreaming,
    isStreaming ? (streamingText || undefined) : undefined,
  );

  // Load session on mount — use cache for instant display, then refresh from API
  useEffect(() => {
    if (sessionId) {
      if (cachedConversation) {
        setConversation(cachedConversation, sessionId);
      }
      loadSession(sessionId)
        .then((entries) => {
          console.log(`[Session ${sessionId}] Loaded ${entries.length} entries`);
          setConversation(entries, sessionId);
          onConversationLoaded?.(sessionId, entries);
        })
        .catch((err) => console.error('Failed to load session:', err));
    } else {
      clear();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Cache conversation when streaming completes
  const wasStreamingRef = useRef(false);

  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && hookSessionId && conversation.length > 0) {
      console.log(`[Session ${hookSessionId}] Streaming ended, caching ${conversation.length} entries`);
      onConversationLoaded?.(hookSessionId, conversation);
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, hookSessionId, conversation, onConversationLoaded]);

  // Send initial prompt
  useEffect(() => {
    if (initialPrompt && !hasSentInitial && !sessionId) {
      setHasSentInitial(true);
      const fullMessage = HIDDEN_PROMPT_PREFIX + '\n\n' + initialPrompt;
      sendMessage(fullMessage, initialSkills).catch((err) =>
        console.error('Initial send error:', err),
      );
    }
  }, [initialPrompt, hasSentInitial, sessionId, sendMessage, initialSkills]);

  // Debug: log derived turns whenever they change
  useEffect(() => {
    if ((stackTurns.length > 0 || processingTurns.length > 0) && sessionId) {
      console.log(`[Session ${sessionId}] stack=${stackTurns.length}, processing=${processingTurns.length}`);
      stackTurns.forEach((t, i) => {
        console.log(`  Stack ${i}: prompt="${t.displayPrompt}", media=${t.media.length}, toolCalls=${t.toolCalls?.length ?? 0}`);
      });
      processingTurns.forEach((t, i) => {
        console.log(`  Processing ${i}: prompt="${t.displayPrompt}", streaming=${t.isStreaming}`);
      });
    }
  }, [stackTurns, processingTurns, sessionId]);

  // Auto-scroll to latest stack card when stack changes
  useEffect(() => {
    if (stackTurns.length > 0) {
      setCurrentIndex(stackTurns.length - 1);
    }
  }, [stackTurns.length]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && !pendingAttachment?.cdnUrl) || isStreaming) return;
    if (pendingAttachment?.isUploading) return;

    const userText = text || 'What is this image?';
    setInput('');

    let message = userText;
    if (pendingAttachment?.cdnUrl) {
      message = `[Attached image: ${pendingAttachment.cdnUrl}]\n\n${userText}`;
    }
    setPendingAttachment(null);

    let fullMessage: string;
    if (stackTurns.length > 0) {
      const currentTurn = stackTurns[currentIndex] ?? stackTurns[stackTurns.length - 1];
      const currentMediaIndex = mediaIndexMap[currentTurn.id] ?? 0;
      console.log(`[Context] card ${currentIndex + 1}/${stackTurns.length}, media ${currentMediaIndex + 1}/${currentTurn.media.length}`);
      const contextMessage = buildMessageContext(
        message,
        currentIndex,
        stackTurns.length,
        currentTurn.displayPrompt,
        currentTurn.media,
        currentMediaIndex,
      );
      fullMessage = HIDDEN_PROMPT_PREFIX + '\n\n' + contextMessage;
    } else {
      fullMessage = HIDDEN_PROMPT_PREFIX + '\n\n' + message;
    }

    try {
      await sendMessage(fullMessage);
    } catch (err) {
      console.error('Send error:', err);
    }
  }, [input, isStreaming, stackTurns, currentIndex, mediaIndexMap, sendMessage, pendingAttachment]);

  const handleSuggestionTap = useCallback(
    async (suggestion: string) => {
      if (isStreaming) return;

      let fullMessage: string;
      if (stackTurns.length > 0) {
        const currentTurn = stackTurns[currentIndex] ?? stackTurns[stackTurns.length - 1];
        const currentMediaIndex = mediaIndexMap[currentTurn.id] ?? 0;
        console.log(`[Suggestion] "${suggestion}" — card ${currentIndex + 1}/${stackTurns.length}, media ${currentMediaIndex + 1}/${currentTurn.media.length}`);
        const contextMessage = buildMessageContext(
          suggestion,
          currentIndex,
          stackTurns.length,
          currentTurn.displayPrompt,
          currentTurn.media,
          currentMediaIndex,
        );
        fullMessage = HIDDEN_PROMPT_PREFIX + '\n\n' + contextMessage;
      } else {
        fullMessage = HIDDEN_PROMPT_PREFIX + '\n\n' + suggestion;
      }

      try {
        await sendMessage(fullMessage);
      } catch (err) {
        console.error('Suggestion send error:', err);
      }
    },
    [isStreaming, stackTurns, currentIndex, mediaIndexMap, sendMessage],
  );

  const handleContinueGenerating = useCallback(async () => {
    if (isStreaming) return;

    const autoPrompt = '[auto-prompt: Finish todos. Always try to finish TODOs.]';
    let fullMessage: string;
    if (stackTurns.length > 0) {
      const currentTurn = stackTurns[currentIndex] ?? stackTurns[stackTurns.length - 1];
      const currentMediaIndex = mediaIndexMap[currentTurn.id] ?? 0;
      fullMessage = buildMessageContext(
        autoPrompt,
        currentIndex,
        stackTurns.length,
        currentTurn.displayPrompt,
        currentTurn.media,
        currentMediaIndex,
      );
    } else {
      fullMessage = autoPrompt;
    }

    try {
      await sendMessage(fullMessage);
    } catch (err) {
      console.error('Finish todos error:', err);
    }
  }, [isStreaming, stackTurns, currentIndex, mediaIndexMap, sendMessage]);

  const handleAttachment = useCallback(
    async (uri: string, type: 'image' | 'document') => {
      if (type !== 'image') {
        Alert.alert('Unsupported', 'Only image attachments are supported.');
        return;
      }

      setPendingAttachment({ localUri: uri, isUploading: true });

      try {
        const fileName = uri.split('/').pop() || 'image.jpg';
        const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const result = await client.upload({ uri, name: fileName, type: mimeType });
        setPendingAttachment((prev) =>
          prev?.localUri === uri
            ? { ...prev, cdnUrl: result.url, isUploading: false }
            : prev,
        );
      } catch (err) {
        console.error('Upload failed:', err);
        setPendingAttachment(null);
        Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
      }
    },
    [client],
  );

  const clearAttachment = useCallback(() => {
    setPendingAttachment(null);
  }, []);

  const handleMediaIndexChange = useCallback(
    (turnId: string, index: number) => {
      setMediaIndexMap((prev) => ({ ...prev, [turnId]: index }));
    },
    [],
  );

  const handleMediaTap = useCallback(
    (mediaItems: MediaInfo[], index: number) => {
      setViewerMedia({ media: mediaItems, index });
    },
    [],
  );

  const inputBarHeight = 60 + insets.bottom;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={-insets.bottom}
    >
      <ProcessingBlob isActive={isStreaming} />

      {/* Back button */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.accentBackground }]}
          onPress={onBack}
        >
          <Text style={[styles.backArrow, { color: colors.accent }]}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* Card stack + processing cards */}
      <View style={[styles.stackArea, { paddingTop: insets.top + 60, paddingBottom: inputBarHeight + 16 }]}>
        {(stackTurns.length > 0 || processingTurns.length > 0) ? (
          <View style={styles.stackContainer}>
            {stackTurns.length > 0 && (
              <View style={styles.stackInner}>
                <CardStack
                  turns={stackTurns}
                  currentIndex={currentIndex}
                  onIndexChange={setCurrentIndex}
                  onSuggestionTap={handleSuggestionTap}
                  onMediaTap={handleMediaTap}
                  onMediaIndexChange={handleMediaIndexChange}
                  mediaIndexMap={mediaIndexMap}
                  isStreamingGlobal={isStreaming}
                  onContinueGenerating={handleContinueGenerating}
                />
              </View>
            )}

            {processingTurns.map((turn) => (
              <ProcessingCard key={turn.id} turn={turn} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Send a message to start
            </Text>
          </View>
        )}
      </View>

      {/* Bottom gradient */}
      <LinearGradient
        colors={[`${colors.background}00`, colors.background]}
        style={[styles.bottomGradient, { height: inputBarHeight + 40 }]}
        pointerEvents="none"
      />

      {/* Input */}
      <View style={styles.inputBarWrapper}>
        <InputBar
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          onCancel={cancel}
          isStreaming={isStreaming}
          onAttachment={handleAttachment}
          pendingAttachment={pendingAttachment}
          onClearAttachment={clearAttachment}
        />
      </View>

      {showFullGraph && onCloseFullGraph && (
        <FullGraphView
          visible={showFullGraph}
          onClose={onCloseFullGraph}
          entries={processedConversation}
          sessionId={sessionId || 'default'}
          focusToolCallId={focusToolCallId}
        />
      )}

      {viewerMedia && (
        <MediaViewer
          media={viewerMedia.media}
          initialIndex={viewerMedia.index}
          onClose={() => setViewerMedia(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '300',
    marginTop: -2,
  },
  stackArea: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  stackContainer: {
    flex: 1,
    gap: 12,
  },
  stackInner: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  inputBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
});
