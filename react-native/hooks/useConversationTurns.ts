import { useMemo } from 'react';
import type { ProcessedEntry, MediaInfo } from '@gr33n-ai/jade-sdk-rn-client';
import {
  groupIntoTurns,
  splitTurns,
  type ConversationTurn,
} from '../types/ConversationTurn';

export function useConversationTurns(
  processedConversation: ProcessedEntry[],
  media: MediaInfo[],
  isStreaming: boolean,
  streamingText?: string,
): { stackTurns: ConversationTurn[]; processingTurns: ConversationTurn[] } {
  return useMemo(() => {
    const turns = groupIntoTurns(processedConversation, media, isStreaming, streamingText);
    return splitTurns(turns);
  }, [processedConversation, media, isStreaming, streamingText]);
}
