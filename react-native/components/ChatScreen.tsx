import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { useJadeSession, parseSuggestions, type ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import MessageBubble from './MessageBubble';
import SpinningLoader from './SpinningLoader';
import InputBar from './InputBar';
import { FullGraphView, type ToolCallNodeURI } from './workflow-graph';
import { getHumanReadableToolName } from '../utils/toolNames';
import { useThemeColors } from '../utils/theme';
import { getToolUI } from './tool-ui';

interface ChatScreenProps {
  sessionId?: string;
  onShowFullGraph: (toolUseId?: string) => void;
  showFullGraph: boolean;
  onCloseFullGraph: () => void;
  focusToolCallId?: ToolCallNodeURI;
}

export default function ChatScreen({
  sessionId,
  onShowFullGraph,
  showFullGraph,
  onCloseFullGraph,
  focusToolCallId,
}: ChatScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const contentHeightRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const forceScrollRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const layoutHeightRef = useRef(0);
  const wasStreamingRef = useRef(false);

  const inputBarHeight = 60 + insets.bottom;

  const scrollToBottom = (animated: boolean) => {
    if (!flatListRef.current || layoutHeightRef.current === 0 || contentHeightRef.current === 0) return;
    const maxOffset = contentHeightRef.current - layoutHeightRef.current;
    if (maxOffset > 0) {
      flatListRef.current.scrollToOffset({
        offset: maxOffset + inputBarHeight,
        animated
      });
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollToBottom(true), 100);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [inputBarHeight]);

  const getDistanceFromBottom = () => {
    const maxScroll = contentHeightRef.current - layoutHeightRef.current;
    return Math.max(0, maxScroll - scrollOffsetRef.current);
  };

  const markdownStyles = useMemo(() => ({
    body: { color: colors.text, fontSize: 15, lineHeight: 22 },
    heading1: { color: colors.text, fontSize: 24, fontWeight: 'bold' as const, marginVertical: 8 },
    heading2: { color: colors.text, fontSize: 20, fontWeight: 'bold' as const, marginVertical: 6 },
    heading3: { color: colors.text, fontSize: 17, fontWeight: 'bold' as const, marginVertical: 4 },
    paragraph: { marginVertical: 4 },
    code_inline: {
      backgroundColor: colors.codeBackground,
      color: colors.accent,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    fence: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: colors.fenceText,
    },
    link: { color: colors.accent },
    list_item: { marginVertical: 2 },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      paddingLeft: 12,
      opacity: 0.8,
    },
    strong: { fontWeight: 'bold' as const },
    em: { fontStyle: 'italic' as const },
  }), [colors]);

  const {
    processedConversation,
    isStreaming,
    streamingText,
    streamingToolCall,
    showTinkering,
    isExecutingTool,
    executingToolName,
    sendMessage,
    cancel,
    loadSession,
    setConversation,
    clear,
  } = useJadeSession();

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
        .then((entries) => {
          forceScrollRef.current = true;
          shouldAutoScrollRef.current = true;
          setConversation(entries, sessionId);
          setTimeout(() => scrollToBottom(false), 150);
        })
        .catch((err) => {
          console.error('Failed to load session:', err);
        });
    } else {
      clear();
    }
  }, [sessionId, loadSession, setConversation, clear]);

  useEffect(() => {
    const currentlyStreaming = isStreaming || !!streamingText;
    if (currentlyStreaming && !wasStreamingRef.current) {
      shouldAutoScrollRef.current = true;
    }
    wasStreamingRef.current = currentlyStreaming;
  }, [isStreaming, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput('');
    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleSuggestionTap = async (suggestion: string) => {
    if (isStreaming) return;
    forceScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    try {
      await sendMessage(suggestion);
    } catch (err) {
      console.error('Suggestion send error:', err);
    }
  };

  const handleAttachment = (uri: string, type: 'image' | 'document') => {
    console.log('Attachment selected:', { uri, type });
  };

  const renderItem = ({ item }: { item: ProcessedEntry }) => (
    <MessageBubble
      entry={item}
      onSuggestionTap={handleSuggestionTap}
      onShowFullGraph={() => onShowFullGraph(item.entry?.tool_use_id)}
    />
  );

  const renderStreamingContent = () => {
    if (streamingText) {
      const { segments } = parseSuggestions(streamingText);
      const markdownText = segments
        .map(seg => {
          if (seg.type === 'suggestion') {
            const encoded = encodeURIComponent(seg.content);
            return `[${seg.content}](suggestion://${encoded})`;
          }
          return seg.content;
        })
        .join('');

      const handleLinkPress = (url: string) => {
        if (url.startsWith('suggestion://')) {
          const suggestionText = decodeURIComponent(url.replace('suggestion://', ''));
          handleSuggestionTap(suggestionText);
          return false;
        }
        return true;
      };

      return (
        <View style={styles.streamingContainer}>
          {markdownText && (
            <Markdown style={markdownStyles} onLinkPress={handleLinkPress}>
              {markdownText}
            </Markdown>
          )}
          <View style={styles.loadingRow}>
            <SpinningLoader size={14} color={colors.accent} />
          </View>
        </View>
      );
    }

    if (streamingToolCall) {
      const displayName = getHumanReadableToolName(streamingToolCall.tool_name);
      return (
        <View style={[styles.toolLoadingBubble, { backgroundColor: colors.toolBubble }]}>
          <Text style={[styles.toolLoadingName, { color: colors.accent }]}>{displayName}</Text>
          <SpinningLoader size={12} color={colors.accent} />
        </View>
      );
    }

    if (showTinkering) {
      return (
        <View style={styles.streamingContainer}>
          <View style={styles.loadingRow}>
            <SpinningLoader size={14} color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Thinking...</Text>
          </View>
        </View>
      );
    }

    if (isExecutingTool) {
      if (executingToolName && getToolUI(executingToolName)) {
        return null;
      }

      const toolLabel = executingToolName
        ? getHumanReadableToolName(executingToolName)
        : 'Running tool...';
      return (
        <View style={[styles.toolLoadingBubble, { backgroundColor: colors.toolBubble }]}>
          <Text style={[styles.toolLoadingName, { color: colors.accent }]}>{toolLabel}</Text>
          <SpinningLoader size={12} color={colors.accent} />
        </View>
      );
    }

    if (isStreaming) {
      return (
        <View style={styles.streamingContainer}>
          <View style={styles.loadingRow}>
            <SpinningLoader size={14} color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Processing...</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="height"
      keyboardVerticalOffset={-insets.bottom}
    >
      <FlatList
        ref={flatListRef}
        data={processedConversation}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={[styles.messageList, { paddingTop: insets.top + 56, paddingBottom: inputBarHeight + 16 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No messages yet</Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Send a message to start</Text>
          </View>
        }
        ListFooterComponent={renderStreamingContent}
        style={styles.flatList}
        onScroll={(event) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          const isCurrentlyStreaming = isStreaming || !!streamingText;
          if (isCurrentlyStreaming && getDistanceFromBottom() > 250) {
            shouldAutoScrollRef.current = false;
          }
        }}
        scrollEventThrottle={16}
        onLayout={(event) => {
          layoutHeightRef.current = event.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_, contentHeight) => {
          const prevHeight = contentHeightRef.current;
          contentHeightRef.current = contentHeight;

          if (forceScrollRef.current) {
            forceScrollRef.current = false;
            scrollToBottom(true);
            return;
          }

          const isCurrentlyStreaming = isStreaming || !!streamingText;
          if (isCurrentlyStreaming && shouldAutoScrollRef.current && contentHeight > prevHeight) {
            scrollToBottom(false);
          }
        }}
      />

      {/* Top fade gradient */}
      <LinearGradient
        colors={[colors.background, `${colors.background}00`]}
        style={[styles.topGradient, { height: insets.top + 56 + 40 }]}
        pointerEvents="none"
      />

      {/* Bottom fade gradient */}
      <LinearGradient
        colors={[`${colors.background}00`, colors.background]}
        style={[styles.bottomGradient, { height: inputBarHeight + 40 }]}
        pointerEvents="none"
      />

      <View style={styles.inputBarWrapper}>
        <InputBar
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          onCancel={cancel}
          isStreaming={isStreaming}
          onAttachment={handleAttachment}
        />
      </View>

      <FullGraphView
        visible={showFullGraph}
        onClose={onCloseFullGraph}
        entries={processedConversation}
        sessionId={sessionId || 'default'}
        focusToolCallId={focusToolCallId}
      />
    </KeyboardAvoidingView>
  );
}

export function useChatSession() {
  return useJadeSession();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  inputBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
  },
  streamingContainer: {
    alignSelf: 'flex-start',
    maxWidth: '95%',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 15,
  },
  toolLoadingBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolLoadingName: {
    fontSize: 13,
    fontWeight: '600',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
