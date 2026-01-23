import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ToolUIProps } from './registry';
import { useThemeColors } from '../../utils/theme';

interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm?: string;
}

export function TodoWriteToolUI({ entry }: ToolUIProps) {
  const colors = useThemeColors();

  const todos = useMemo(() => {
    try {
      const input = typeof entry.entry?.tool_input === 'string'
        ? JSON.parse(entry.entry.tool_input)
        : entry.entry?.tool_input;
      if (input?.todos && Array.isArray(input.todos)) {
        return input.todos as TodoItem[];
      }
    } catch {
      // Parsing failed
    }
    return [];
  }, [entry]);

  if (todos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks</Text>
      </View>
    );
  }

  const completedCount = todos.filter(t => t.status === 'completed').length;

  const renderStatusIndicator = (status: TodoItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <View style={[styles.statusCircle, { borderColor: colors.textMuted }]} />
        );
      case 'in_progress':
        return (
          <View style={[styles.statusCircle, styles.statusFilled, { backgroundColor: colors.warning }]} />
        );
      case 'completed':
        return (
          <View style={[styles.statusCircle, styles.statusFilled, { backgroundColor: colors.success }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const getDisplayText = (todo: TodoItem) => {
    if (todo.status === 'in_progress' && todo.activeForm) {
      return todo.activeForm;
    }
    return todo.content;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.count, { color: colors.textMuted }]}>
          {completedCount}/{todos.length} completed
        </Text>
      </View>
      {todos.map((todo, index) => (
        <View key={index} style={styles.todoItem}>
          {renderStatusIndicator(todo.status)}
          <Text
            style={[
              styles.todoText,
              { color: colors.text },
              todo.status === 'completed' && styles.todoCompleted,
              todo.status === 'in_progress' && { color: colors.warning },
            ]}
            numberOfLines={2}
          >
            {getDisplayText(todo)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    marginBottom: 8,
  },
  count: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    gap: 8,
  },
  statusCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusFilled: {
    borderWidth: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  todoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
