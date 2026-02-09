import type { ProcessedEntry, MediaInfo } from '@gr33n-ai/jade-sdk-rn-client';
import { stripPromptMetadata, stripSuggestions } from '../utils/promptMetadata';

export interface ConversationTurn {
  id: string;
  userPrompt: string;
  displayPrompt: string;
  toolCalls: ProcessedEntry[];
  toolResults: ProcessedEntry[];
  assistantResponse?: string;
  displayResponse?: string;
  suggestions: string[];
  media: MediaInfo[];
  isStreaming: boolean;
  error?: string;
}

export function groupIntoTurns(
  entries: ProcessedEntry[],
  media: MediaInfo[],
  isStreaming: boolean,
  streamingText?: string,
): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  let current: ConversationTurn | null = null;

  for (const entry of entries) {
    const type = entry.originalType;

    if (type === 'user_text') {
      if (current) turns.push(current);
      const rawPrompt = (entry.data?.text as string) || entry.entry?.text || '';
      current = {
        id: `turn-${turns.length}`,
        userPrompt: rawPrompt,
        displayPrompt: stripPromptMetadata(rawPrompt),
        toolCalls: [],
        toolResults: [],
        suggestions: [],
        media: [],
        isStreaming: false,
      };
    } else if (current) {
      if (type === 'tool_call') {
        current.toolCalls.push(entry);
        const toolUseId = (entry.data?.toolUseId as string) ?? entry.entry?.tool_use_id;
        if (toolUseId) {
          const matchingMedia = media.filter((m) => m.toolUseId === toolUseId);
          for (const m of matchingMedia) {
            if (!current.media.some((existing) => existing.url === m.url)) {
              current.media.push(m);
            }
          }
        }
      } else if (type === 'tool_result') {
        current.toolResults.push(entry);

        // Extract media from this tool result
        const resultContent = entry.entry?.content;
        if (typeof resultContent === 'string') {
          const toolUseId = entry.entry?.tool_use_id;
          const matchingMedia = media.filter(
            (m) => m.toolUseId === toolUseId,
          );
          for (const m of matchingMedia) {
            if (!current.media.some((existing) => existing.url === m.url)) {
              current.media.push(m);
            }
          }
        }
      } else if (type === 'assistant_text') {
        // Prefer entry.entry.text (raw, with <gr3.suggestion> tags) over
        // entry.data.text (already cleaned by SDK processing)
        const text = (entry.entry?.text as string) || (entry.data?.text as string) || '';
        if (text) {
          current.assistantResponse = current.assistantResponse
            ? current.assistantResponse + '\n' + text
            : text;
        }
      } else if (type === 'error') {
        current.error =
          (entry.data?.text as string) || entry.entry?.text || 'Unknown error';
      }
    }
  }

  if (current) turns.push(current);

  // Fallback: assign unmatched media to last turn with tool calls
  if (turns.length > 0) {
    const assignedUrls = new Set(
      turns.flatMap((t) => t.media.map((m) => m.url)),
    );
    const unassigned = media.filter((m) => !assignedUrls.has(m.url));
    if (unassigned.length > 0) {
      const target =
        [...turns].reverse().find((t) => t.toolCalls.length > 0)
        ?? turns[turns.length - 1];
      for (const m of unassigned) {
        if (!target.media.some((existing) => existing.url === m.url)) {
          target.media.push(m);
        }
      }
    }
  }

  // Sort each turn's media newest-first to match session card hero
  for (const turn of turns) {
    if (turn.media.length > 1) {
      turn.media.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    }
  }

  // Process suggestions and streaming state
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.assistantResponse) {
      const { clean, suggestions } = stripSuggestions(turn.assistantResponse);
      turn.displayResponse = clean || undefined;
      turn.suggestions = suggestions;
    }
  }

  // Mark last turn as streaming if applicable
  if (turns.length > 0 && isStreaming) {
    turns[turns.length - 1].isStreaming = true;
    if (streamingText) {
      const { clean, suggestions } = stripSuggestions(streamingText);
      const lastTurn = turns[turns.length - 1];
      lastTurn.assistantResponse = streamingText;
      lastTurn.displayResponse = clean || undefined;
      lastTurn.suggestions = [
        ...lastTurn.suggestions,
        ...suggestions,
      ];
    }
  }

  return turns;
}

export function getTodoState(
  turn: ConversationTurn,
): { completed: number; total: number } | null {
  const todoCall = [...turn.toolCalls]
    .reverse()
    .find((tc) => (tc.data?.toolName as string) === 'TodoWrite');
  if (!todoCall) return null;

  try {
    const input =
      typeof todoCall.entry?.tool_input === 'string'
        ? JSON.parse(todoCall.entry.tool_input)
        : todoCall.entry?.tool_input;
    if (input?.todos && Array.isArray(input.todos)) {
      const todos = input.todos as { status: string }[];
      return {
        completed: todos.filter((t) => t.status === 'completed').length,
        total: todos.length,
      };
    }
  } catch {
    // Parsing failed
  }
  return null;
}

export function splitTurns(turns: ConversationTurn[]): {
  stackTurns: ConversationTurn[];
  processingTurns: ConversationTurn[];
} {
  const completed = turns.filter((t) => !t.isStreaming);
  if (completed.length === 0) {
    return { stackTurns: turns, processingTurns: [] };
  }
  const processing = turns.filter((t) => t.isStreaming);
  let stack: ConversationTurn[];
  if (completed.length > 1) {
    const lastId = completed[completed.length - 1].id;
    const filtered = completed.filter(
      (t) => t.id === lastId || t.media.length > 0 || t.error,
    );
    stack = filtered.length === 0 ? [completed[completed.length - 1]] : filtered;
  } else {
    stack = completed;
  }
  return { stackTurns: stack, processingTurns: processing };
}
