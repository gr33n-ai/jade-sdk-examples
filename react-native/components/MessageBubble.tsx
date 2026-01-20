import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import type { ProcessedEntry, TextSegment } from '@gr33n-ai/jade-sdk-rn-client';
import { getHumanReadableToolName } from '../utils/toolNames';
import { ToolUI } from './tool-ui';

interface Props {
  entry: ProcessedEntry;
  onSuggestionTap?: (suggestion: string) => void;
}

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

export default function MessageBubble({ entry, onSuggestionTap }: Props) {
  const [expanded, setExpanded] = useState(true);

  const type = entry.displayType || entry.originalType || entry.entry?.type;
  const originalType = entry.originalType;
  const text = (entry.data?.text as string) || entry.entry?.text;
  const textSegments = entry.textSegments;

  if (type === 'compact_boundary' || type === 'compact') {
    return null;
  }

  if (originalType === 'tool_call') {
    const rawToolName = (entry.data?.toolName as string) || entry.entry?.tool_name || 'Tool';
    const toolName = getHumanReadableToolName(rawToolName);

    return (
      <View style={[styles.bubble, styles.toolBubble]}>
        <TouchableOpacity
          style={styles.toolHeaderRow}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.toolName}>{toolName}</Text>
          <Text style={styles.expandHint}>{expanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {expanded && <ToolUI entry={entry} toolName={rawToolName} />}
      </View>
    );
  }

  if (type === 'user_text') {
    return (
      <View style={[styles.bubble, styles.userBubble]}>
        <Text style={styles.messageText}>{text}</Text>
      </View>
    );
  }

  if (type === 'assistant_text' || type === 'markdown_text') {
    if (textSegments && textSegments.length > 0) {
      const markdownText = textSegments
        .map((seg: TextSegment) => {
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
          onSuggestionTap?.(suggestionText);
          return false;
        }
        return true;
      };

      return (
        <View style={styles.assistantContainer}>
          <Markdown style={markdownStyles} onLinkPress={handleLinkPress}>
            {markdownText}
          </Markdown>
        </View>
      );
    }

    return (
      <View style={styles.assistantContainer}>
        <Markdown style={markdownStyles}>{text || ''}</Markdown>
      </View>
    );
  }

  if (type === 'tool_result' || type === 'raw_content' || type === 'simple_message') {
    const content = entry.data?.content || entry.data?.message || entry.entry?.content;
    const contentStr =
      typeof content === 'string'
        ? content
        : JSON.stringify(content, null, 2);
    const truncated = contentStr.length > 300 ? contentStr.slice(0, 300) + '...' : contentStr;
    const isError = Boolean((entry.entry as unknown as { is_error?: boolean } | undefined)?.is_error);

    return (
      <TouchableOpacity
        style={[styles.bubble, styles.resultBubble, isError && styles.errorBubble]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.toolHeader}>
          <Text style={[styles.resultLabel, isError && styles.errorLabel]}>
            {isError ? '✗ Error' : '✓ Result'}
          </Text>
          {contentStr.length > 300 && (
            <Text style={styles.expandHint}>{expanded ? '▼' : '▶'}</Text>
          )}
        </View>
        <Text style={styles.resultContent}>{expanded ? contentStr : truncated}</Text>
      </TouchableOpacity>
    );
  }

  if (type === 'compact_summary') {
    return (
      <View style={[styles.bubble, styles.summaryBubble]}>
        <Text style={styles.summaryText}>
          {text || '[Conversation compacted]'}
        </Text>
      </View>
    );
  }

  if (type === 'error') {
    const errorText = (entry.data?.text as string) || text || 'Unknown error';
    return (
      <View style={[styles.bubble, styles.errorMessageBubble]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorMessageText}>{errorText}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: '#4a9eff',
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    maxWidth: '95%',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  toolBubble: {
    backgroundColor: '#1e3a5f',
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  toolHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultBubble: {
    backgroundColor: '#1a3d1a',
    alignSelf: 'flex-start',
  },
  errorBubble: {
    backgroundColor: '#3d1a1a',
  },
  summaryBubble: {
    backgroundColor: '#333',
    alignSelf: 'center',
    maxWidth: '90%',
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  toolName: {
    color: '#4a9eff',
    fontSize: 13,
    fontWeight: '600',
  },
  expandHint: {
    color: '#666',
    fontSize: 10,
  },
  toolInput: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  resultLabel: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  errorLabel: {
    color: '#ff6b6b',
  },
  resultContent: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  summaryText: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorMessageBubble: {
    backgroundColor: '#4a1a1a',
    alignSelf: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
  },
  errorIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  errorMessageText: {
    color: '#ff9999',
    fontSize: 14,
  },
});
