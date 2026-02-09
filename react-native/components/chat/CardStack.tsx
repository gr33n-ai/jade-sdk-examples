import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { CardStack as CS, Spacing } from '../../utils/designConstants';
import CardStackItem from './CardStackItem';
import ChatCard from './ChatCard';
import PromptRow from './PromptRow';
import ToolCallRow from './ToolCallRow';
import MediaCarousel from './MediaCarousel';
import { SuggestionPillsForMedia, ContinueGeneratingPill } from './SuggestionPills';
import { useThemeColors } from '../../utils/theme';
import { getHumanReadableToolName } from '../../utils/toolNames';
import { getTodoState, type ConversationTurn } from '../../types/ConversationTurn';

interface CardStackProps {
  turns: ConversationTurn[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onSuggestionTap?: (suggestion: string) => void;
  onMediaTap?: (media: ConversationTurn['media'], index: number) => void;
  onMediaIndexChange?: (turnId: string, index: number) => void;
  mediaIndexMap?: Record<string, number>;
  isStreamingGlobal: boolean;
  onContinueGenerating?: () => void;
}

const SPRING_CONFIG = {
  damping: CS.springDamping * 20,
  stiffness: (1 / CS.springResponse) * 100,
  mass: 1,
};

export default function CardStackComponent({
  turns,
  currentIndex,
  onIndexChange,
  onSuggestionTap,
  onMediaTap,
  onMediaIndexChange,
  mediaIndexMap,
  isStreamingGlobal,
  onContinueGenerating,
}: CardStackProps) {
  const colors = useThemeColors();
  const { height: screenHeight } = useWindowDimensions();
  const dragOffset = useSharedValue(0);

  const totalCards = turns.length;

  const visibleRange = useMemo(() => {
    const start = Math.max(0, currentIndex - CS.maxVisibleCards + 1);
    const end = Math.min(totalCards - 1, currentIndex + CS.maxDismissedVisible);
    return { start, end };
  }, [currentIndex, totalCards]);

  const navigateForward = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, totalCards, onIndexChange]);

  const navigateBackward = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-15, 15])
    .onUpdate((e) => {
      dragOffset.value = e.translationY;
    })
    .onEnd((e) => {
      const translation = e.translationY;
      const velocity = e.velocityY;

      if (
        translation > CS.swipeThreshold ||
        velocity > CS.velocityThreshold
      ) {
        // Swipe down → go backward
        runOnJS(navigateBackward)();
      } else if (
        translation < -CS.swipeThreshold ||
        velocity < -CS.velocityThreshold
      ) {
        // Swipe up → go forward
        runOnJS(navigateForward)();
      }

      dragOffset.value = withSpring(0, SPRING_CONFIG);
    });

  const renderCard = useCallback(
    (index: number) => {
      if (index < 0 || index >= turns.length) return null;
      const turn = turns[index];
      const isCurrentCard = index === currentIndex;
      const isLast = index === turns.length - 1;
      const showSuggestions =
        isCurrentCard && !turn.isStreaming && !isStreamingGlobal;
      const todoState2 = !turn.isStreaming && !isStreamingGlobal ? getTodoState(turn) : null;
      const showContinue =
        isCurrentCard && isLast && !turn.isStreaming && !isStreamingGlobal &&
        todoState2 !== null && todoState2.completed < todoState2.total;
      const hasMedia = turn.media.length > 0;
      const lastToolName =
        turn.toolCalls.length > 0
          ? (turn.toolCalls[turn.toolCalls.length - 1]?.data?.toolName as string) || ''
          : '';
      const isLastToolTodo = lastToolName === 'TodoWrite';
      const todoState = turn.isStreaming ? getTodoState(turn) : null;

      return (
        <View key={turn.id}>
          <ChatCard>
            {turn.displayPrompt.length > 0 && (
              <PromptRow text={turn.displayPrompt} />
            )}

            {todoState && (
              <ToolCallRow
                toolName="Tasks"
                state={{ type: 'todo', completed: todoState.completed, total: todoState.total }}
              />
            )}

            {turn.isStreaming && turn.toolCalls.length === 0 && !todoState && (
              <ToolCallRow toolName="Thinking" state={{ type: 'inProgress' }} />
            )}

            {turn.isStreaming && turn.toolCalls.length > 0 && !isLastToolTodo && (
              <ToolCallRow
                toolName={getHumanReadableToolName(lastToolName || 'Processing')}
                state={{ type: 'inProgress' }}
              />
            )}

            {!turn.isStreaming && turn.toolCalls.length > 0 && (
              <ToolCallRow
                toolName={`Made ${turn.toolCalls.length} tool call${turn.toolCalls.length > 1 ? 's' : ''}`}
                state={{ type: 'completed' }}
              />
            )}

            {turn.error && (
              <ToolCallRow
                toolName="Error"
                state={{ type: 'failed', message: turn.error }}
              />
            )}

            {hasMedia && (
              <MediaCarousel
                media={turn.media}
                initialIndex={mediaIndexMap?.[turn.id] ?? 0}
                onTap={(mediaIndex) => onMediaTap?.(turn.media, mediaIndex)}
                onIndexChange={(idx) => onMediaIndexChange?.(turn.id, idx)}
              />
            )}

            {!hasMedia &&
              !turn.isStreaming &&
              !turn.error &&
              turn.toolCalls.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.cardTextSecondary }]}>
                  Nothing generated
                </Text>
              )}
          </ChatCard>

          {(showContinue || showSuggestions) && (
            <View style={styles.suggestionsWrapper}>
              <SuggestionPillsForMedia
                suggestions={showSuggestions ? turn.suggestions : []}
                onTap={(s) => onSuggestionTap?.(s)}
                before={showContinue && onContinueGenerating && todoState2 ? (
                  <ContinueGeneratingPill onTap={onContinueGenerating} remaining={todoState2.total - todoState2.completed} />
                ) : undefined}
              />
            </View>
          )}
        </View>
      );
    },
    [turns, currentIndex, isStreamingGlobal, colors, onMediaTap, onSuggestionTap, onMediaIndexChange, mediaIndexMap, onContinueGenerating],
  );

  const indices = useMemo(() => {
    const result: number[] = [];
    for (let i = visibleRange.end; i >= visibleRange.start; i--) {
      result.push(i);
    }
    return result;
  }, [visibleRange]);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, { paddingTop: (CS.maxVisibleCards - 2) * CS.cardOffset }]}>
        {indices.map((index) => {
          const relativePosition = currentIndex - index;
          return (
            <CardStackItem
              key={turns[index]?.id ?? index}
              position={relativePosition}
              dragOffset={dragOffset}
              isTopCard={index === currentIndex}
              containerHeight={screenHeight * 0.7}
            >
              {renderCard(index)}
            </CardStackItem>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  suggestionsWrapper: {
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: 12,
  },
});
