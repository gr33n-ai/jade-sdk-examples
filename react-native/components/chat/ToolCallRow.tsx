import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import SpinningLoader from '../SpinningLoader';
import { useThemeColors } from '../../utils/theme';

export type ToolCallState =
  | { type: 'inProgress' }
  | { type: 'completed' }
  | { type: 'todo'; completed: number; total: number }
  | { type: 'failed'; message: string };

interface ToolCallRowProps {
  toolName: string;
  state: ToolCallState;
}

function TodoRing({ completed, total, size = 14 }: { completed: number; total: number; size?: number }) {
  const colors = useThemeColors();
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const progressLength = circumference * progress;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.cardTextSecondary}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={0.2}
      />
      {completed > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${progressLength} ${circumference - progressLength}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      )}
    </Svg>
  );
}

export default function ToolCallRow({ toolName, state }: ToolCallRowProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      {state.type === 'inProgress' && (
        <SpinningLoader size={14} color={colors.accent} />
      )}
      {state.type === 'completed' && (
        <Text style={[styles.checkmark, { color: colors.success }]}>✓</Text>
      )}
      {state.type === 'todo' && (
        <TodoRing completed={state.completed} total={state.total} />
      )}
      {state.type === 'failed' && (
        <Text style={[styles.checkmark, { color: colors.error }]}>✗</Text>
      )}
      <Text style={[styles.name, { color: colors.cardTextSecondary }]}>
        {toolName}
      </Text>
      {state.type === 'todo' && state.completed < state.total && (
        <Text style={[styles.count, { color: colors.cardTextSecondary }]}>
          {state.completed}/{state.total}
        </Text>
      )}
      {state.type === 'failed' && (
        <Text
          style={[styles.errorText, { color: colors.error }]}
          numberOfLines={1}
        >
          {state.message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '600',
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
  },
  count: {
    fontSize: 12,
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
});
