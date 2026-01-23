import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import Markdown from 'react-native-markdown-display';
import type { ProcessedEntry, TextSegment } from '@gr33n-ai/jade-sdk-rn-client';
import { getHumanReadableToolName } from '../utils/toolNames';
import { ToolUI, shouldDefaultCollapsed, getCollapsedSummary, getToolUI } from './tool-ui';
import { useThemeColors } from '../utils/theme';

interface Props {
  entry: ProcessedEntry;
  onSuggestionTap?: (suggestion: string) => void;
  onShowFullGraph?: () => void;
}

interface ToolCallBubbleProps {
  entry: ProcessedEntry;
  rawToolName: string;
  toolName: string;
  CollapsedSummary: React.ComponentType<{ entry: ProcessedEntry }> | null;
  hasToolUI: boolean;
  expanded: boolean;
  toggleExpanded: () => void;
  onShowFullGraph?: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

function ToolCallBubble({
  entry,
  rawToolName,
  toolName,
  CollapsedSummary,
  hasToolUI,
  expanded,
  toggleExpanded,
  onShowFullGraph,
  colors,
}: ToolCallBubbleProps) {
  const animatedValue = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded, animatedValue]);

  return (
    <View style={[styles.bubble, { backgroundColor: colors.toolBubble }]}>
      <TouchableOpacity
        style={styles.toolHeaderRow}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.toolHeaderLeft}>
          <Text style={[styles.toolName, { color: colors.accent }]}>{toolName}</Text>
          {!expanded && CollapsedSummary && (
            <CollapsedSummary entry={entry} />
          )}
        </View>
        <Text style={[styles.expandHint, { color: colors.textMuted }]}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {hasToolUI && (
        <Animated.View
          style={{
            opacity: animatedValue,
            maxHeight: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000],
            }),
            overflow: 'hidden',
          }}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <ToolUI entry={entry} toolName={rawToolName} isCollapsed={!expanded} onShowFullGraph={onShowFullGraph} />
        </Animated.View>
      )}
    </View>
  );
}

export default function MessageBubble({ entry, onSuggestionTap, onShowFullGraph }: Props) {
  const colors = useThemeColors();

  const rawToolName = useMemo(() => {
    if (entry.originalType === 'tool_call') {
      return (entry.data?.toolName as string) || entry.entry?.tool_name || 'Tool';
    }
    return '';
  }, [entry]);

  const [expanded, setExpanded] = useState(() => !shouldDefaultCollapsed(rawToolName));

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const markdownStyles = useMemo(() => ({
    body: { color: colors.text, fontSize: 15, lineHeight: 22 },
    heading1: { color: colors.text, fontSize: 24, fontWeight: 'bold' as const, marginVertical: 8 },
    heading2: { color: colors.text, fontSize: 20, fontWeight: 'bold' as const, marginVertical: 6 },
    heading3: { color: colors.text, fontSize: 17, fontWeight: 'bold' as const, marginVertical: 4 },
    paragraph: { marginVertical: 4 },
    code_inline: {
      backgroundColor: colors.codeBackground,
      color: colors.codeText,
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

  const type = entry.displayType || entry.originalType || entry.entry?.type;
  const originalType = entry.originalType;
  const text = (entry.data?.text as string) || entry.entry?.text;
  const textSegments = entry.textSegments;

  if (type === 'compact_boundary' || type === 'compact') {
    return null;
  }

  if (originalType === 'tool_call') {
    const toolName = getHumanReadableToolName(rawToolName);
    const CollapsedSummary = getCollapsedSummary(rawToolName);
    const hasToolUI = getToolUI(rawToolName) !== null;

    if (!hasToolUI && !CollapsedSummary) {
      return null;
    }

    return (
      <ToolCallBubble
        entry={entry}
        rawToolName={rawToolName}
        toolName={toolName}
        CollapsedSummary={CollapsedSummary}
        hasToolUI={hasToolUI}
        expanded={expanded}
        toggleExpanded={toggleExpanded}
        onShowFullGraph={onShowFullGraph}
        colors={colors}
      />
    );
  }

  if (type === 'user_text') {
    return (
      <View style={[styles.bubble, styles.userBubble, { backgroundColor: colors.userBubble }]}>
        <Text style={[styles.messageText, { color: colors.userBubbleText }]}>{text}</Text>
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
        style={[styles.bubble, styles.resultBubble, { backgroundColor: isError ? colors.errorBubble : colors.resultBubble }]}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.toolHeader}>
          <Text style={[styles.resultLabel, { color: isError ? colors.error : colors.success }]}>
            {isError ? '✗ Error' : '✓ Result'}
          </Text>
          {contentStr.length > 300 && (
            <Text style={[styles.expandHint, { color: colors.textMuted }]}>{expanded ? '▼' : '▶'}</Text>
          )}
        </View>
        <Text style={[styles.resultContent, { color: colors.textSecondary }]}>{expanded ? contentStr : truncated}</Text>
      </TouchableOpacity>
    );
  }

  if (type === 'compact_summary') {
    return (
      <View style={[styles.bubble, styles.summaryBubble, { backgroundColor: colors.summaryBubble }]}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {text || '[Conversation compacted]'}
        </Text>
      </View>
    );
  }

  if (type === 'error') {
    const errorText = (entry.data?.text as string) || text || 'Unknown error';
    return (
      <View style={[styles.bubble, styles.errorMessageBubble, { backgroundColor: colors.errorMessageBubble, borderLeftColor: colors.error }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorMessageText, { color: colors.errorLight }]}>{errorText}</Text>
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
    marginBottom: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    maxWidth: '95%',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  toolHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  resultBubble: {
    alignSelf: 'flex-start',
  },
  summaryBubble: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  messageText: {
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
    fontSize: 13,
    fontWeight: '600',
  },
  expandHint: {
    fontSize: 10,
  },
  toolInput: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultContent: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  summaryText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorMessageBubble: {
    alignSelf: 'flex-start',
    borderLeftWidth: 3,
  },
  errorIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  errorMessageText: {
    fontSize: 14,
  },
});
