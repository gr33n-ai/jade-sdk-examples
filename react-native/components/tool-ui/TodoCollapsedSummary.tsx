import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { CollapsedSummaryProps } from './registry';
import { useThemeColors } from '../../utils/theme';

interface TodoItem {
  status: 'pending' | 'in_progress' | 'completed';
}

interface ProgressCircleProps {
  completed: number;
  inProgress: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

function ProgressCircle({ completed, inProgress, total, size = 14, strokeWidth = 2 }: ProgressCircleProps) {
  const colors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const completedProgress = total > 0 ? completed / total : 0;
  const inProgressProgress = total > 0 ? inProgress / total : 0;

  const completedLength = circumference * completedProgress;
  const inProgressLength = circumference * inProgressProgress;
  const inProgressRotation = -90 + (completedProgress * 360);

  return (
    <Svg width={size} height={size}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.textMuted}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={0.3}
      />
      {/* In-progress segment (yellow) - drawn after completed */}
      {inProgress > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.warning}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${inProgressLength} ${circumference - inProgressLength}`}
          strokeLinecap="round"
          rotation={inProgressRotation}
          origin={`${size / 2}, ${size / 2}`}
        />
      )}
      {/* Completed segment (green) - starts at top */}
      {completed > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.success}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${completedLength} ${circumference - completedLength}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      )}
    </Svg>
  );
}

export function TodoCollapsedSummary({ entry }: CollapsedSummaryProps) {
  const colors = useThemeColors();

  const { completed, inProgress, total } = useMemo(() => {
    try {
      const input = typeof entry.entry?.tool_input === 'string'
        ? JSON.parse(entry.entry.tool_input)
        : entry.entry?.tool_input;
      if (input?.todos && Array.isArray(input.todos)) {
        const todos = input.todos as TodoItem[];
        return {
          completed: todos.filter(t => t.status === 'completed').length,
          inProgress: todos.filter(t => t.status === 'in_progress').length,
          total: todos.length,
        };
      }
    } catch {
      // Parsing failed
    }
    return { completed: 0, inProgress: 0, total: 0 };
  }, [entry]);

  if (total === 0) return null;

  return (
    <View style={styles.container}>
      <ProgressCircle completed={completed} inProgress={inProgress} total={total} />
      <Text style={[styles.text, { color: colors.textMuted }]}>
        {completed}/{total} done
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 12,
  },
});
