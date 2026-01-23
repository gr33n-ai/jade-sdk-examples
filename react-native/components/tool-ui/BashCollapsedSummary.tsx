import React, { useMemo } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import type { CollapsedSummaryProps } from './registry';
import { useThemeColors } from '../../utils/theme';

const MAX_SNIPPET_LENGTH = 40;

export function BashCollapsedSummary({ entry }: CollapsedSummaryProps) {
  const colors = useThemeColors();

  const snippet = useMemo(() => {
    try {
      const input = typeof entry.entry?.tool_input === 'string'
        ? JSON.parse(entry.entry.tool_input)
        : entry.entry?.tool_input;
      const command = input?.command || '';
      if (command.length > MAX_SNIPPET_LENGTH) {
        return command.slice(0, MAX_SNIPPET_LENGTH) + '…';
      }
      return command;
    } catch {
      return '';
    }
  }, [entry]);

  if (!snippet) return null;

  return (
    <Text style={[styles.snippet, { color: colors.textMuted }]} numberOfLines={1}>
      {snippet}
    </Text>
  );
}

const styles = StyleSheet.create({
  snippet: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
});
