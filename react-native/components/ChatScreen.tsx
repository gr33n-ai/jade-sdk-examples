import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useJadeSession, parseSuggestions, type ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import type { TabParamList } from '../types/navigation';
import MessageBubble from './MessageBubble';
import MediaDisplay from './MediaDisplay';
import ToolHistory from './ToolHistory';
import SpinningLoader from './SpinningLoader';
import { getHumanReadableToolName } from '../utils/toolNames';

const markdownStyles = {
  body: { color: '#fff', fontSize: 15, lineHeight: 22 },
  heading1: { color: '#fff', fontSize: 24, fontWeight: 'bold' as const, marginVertical: 8 },
  heading2: { color: '#fff', fontSize: 20, fontWeight: 'bold' as const, marginVertical: 6 },
  heading3: { color: '#fff', fontSize: 17, fontWeight: 'bold' as const, marginVertical: 4 },
  paragraph: { marginVertical: 4 },
  code_inline: {
    backgroundColor: '#333',
    color: '#4ade80',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fence: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#e0e0e0',
  },
  link: { color: '#4a9eff' },
  list_item: { marginVertical: 2 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#4a9eff',
    paddingLeft: 12,
    opacity: 0.8,
  },
  strong: { fontWeight: 'bold' as const },
  em: { fontStyle: 'italic' as const },
};

type Props = BottomTabScreenProps<TabParamList, 'Chat'>;

export default function ChatScreen({ navigation, route }: Props) {
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const sessionId = route.params?.sessionId;

  const {
    processedConversation,
    media,
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

  useFocusEffect(
    useCallback(() => {
      const currentSessionId = route.params?.sessionId;
      if (currentSessionId) {
        loadSession(currentSessionId)
          .then((entries) => {
            setConversation(entries, currentSessionId);
          })
          .catch((err) => {
            console.error('Failed to load session:', err);
          });
      }
    }, [route.params?.sessionId, loadSession, setConversation])
  );

  const handleNewThread = useCallback(() => {
    clear();
    navigation.setParams({ sessionId: undefined });
  }, [clear, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleNewThread} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>New</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleNewThread]);

  const handleScrollToEntry = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  useEffect(() => {
    if (flatListRef.current && processedConversation.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [processedConversation.length, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput('');

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleSuggestionTap = async (suggestion: string) => {
    if (isStreaming) return;
    try {
      await sendMessage(suggestion);
    } catch (err) {
      console.error('Suggestion send error:', err);
    }
  };

  const renderItem = ({ item }: { item: ProcessedEntry }) => (
    <MessageBubble entry={item} onSuggestionTap={handleSuggestionTap} />
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
            <SpinningLoader size={14} color="#4a9eff" />
          </View>
        </View>
      );
    }

    if (streamingToolCall) {
      const displayName = getHumanReadableToolName(streamingToolCall.tool_name);
      return (
        <View style={styles.streamingContainer}>
          <View style={styles.loadingRow}>
            <SpinningLoader size={14} color="#4a9eff" />
            <Text style={styles.loadingText}>{displayName}</Text>
          </View>
        </View>
      );
    }

    if (showTinkering) {
      return (
        <View style={styles.streamingContainer}>
          <View style={styles.loadingRow}>
            <SpinningLoader size={14} color="#4a9eff" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        </View>
      );
    }

    if (isExecutingTool) {
      const toolLabel = executingToolName
        ? getHumanReadableToolName(executingToolName)
        : 'Running tool...';
      return (
        <View style={styles.streamingContainer}>
          <View style={styles.loadingRow}>
            <SpinningLoader size={14} color="#4a9eff" />
            <Text style={styles.loadingText}>{toolLabel}</Text>
          </View>
        </View>
      );
    }

    if (isStreaming) {
      return (
        <View style={styles.streamingContainer}>
          <View style={styles.loadingRow}>
            <SpinningLoader size={14} color="#4a9eff" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ToolHistory
        entries={processedConversation}
        onScrollToEntry={handleScrollToEntry}
      />

      {media.length > 0 && (
        <View style={styles.mediaBar}>
          <MediaDisplay media={media} />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={processedConversation}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptyHint}>Send a message to start</Text>
          </View>
        }
        ListFooterComponent={renderStreamingContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
          maxLength={10000}
          editable={!isStreaming}
        />
        {isStreaming ? (
          <TouchableOpacity style={styles.cancelButton} onPress={cancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  mediaBar: {
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
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
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
    color: '#888',
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4a9eff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4a9eff',
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
