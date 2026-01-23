import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { ToolUIProps } from './registry';
import { useThemeColors } from '../../utils/theme';

export function BashToolUI({ entry }: ToolUIProps) {
  const colors = useThemeColors();

  const command = useMemo(() => {
    try {
      const input = typeof entry.entry?.tool_input === 'string'
        ? JSON.parse(entry.entry.tool_input)
        : entry.entry?.tool_input;
      return input?.command || '';
    } catch {
      return '';
    }
  }, [entry]);

  if (!command) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.codeBlock, { backgroundColor: colors.background }]}>
        <Text style={[styles.codeText, { color: colors.fenceText }]}>{command}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  codeBlock: {
    padding: 10,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
});
