import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import { useThemeColors } from '../utils/theme';

const DROPDOWN_WIDTH = 280;
const MAX_HEIGHT = 320;

interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

interface TaskDropdownProps {
  visible: boolean;
  onClose: () => void;
  processedConversation: ProcessedEntry[];
  anchorPosition: { x: number; y: number };
}

function extractTodos(conversation: ProcessedEntry[]): TodoItem[] {
  let latestTodos: TodoItem[] = [];

  for (const entry of conversation) {
    try {
      const input = typeof entry.entry?.tool_input === 'string'
        ? JSON.parse(entry.entry.tool_input)
        : entry.entry?.tool_input;
      if (input?.todos && Array.isArray(input.todos)) {
        latestTodos = input.todos;
      }
    } catch {
      // Parsing failed, continue
    }
  }

  return latestTodos;
}

export default function TaskDropdown({
  visible,
  onClose,
  processedConversation,
  anchorPosition,
}: TaskDropdownProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const todos = useMemo(() => extractTodos(processedConversation), [processedConversation]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 20,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

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

  const screenWidth = Dimensions.get('window').width;
  const dropdownLeft = Math.min(
    anchorPosition.x - DROPDOWN_WIDTH + 40,
    screenWidth - DROPDOWN_WIDTH - 16
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.dropdown,
          {
            top: anchorPosition.y + 8,
            left: Math.max(16, dropdownLeft),
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              {
                translateY: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.dropdownContent, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Tasks</Text>
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {todos.filter(t => t.status === 'completed').length}/{todos.length}
            </Text>
          </View>

          {todos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks</Text>
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                Tasks will appear here when Jade creates them
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.todoList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.todoListContent}
            >
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
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdown: {
    position: 'absolute',
    width: DROPDOWN_WIDTH,
    maxHeight: MAX_HEIGHT,
  },
  dropdownContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  count: {
    fontSize: 13,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  todoList: {
    maxHeight: MAX_HEIGHT - 52,
  },
  todoListContent: {
    padding: 12,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  statusCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginTop: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusFilled: {
    borderWidth: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  todoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
