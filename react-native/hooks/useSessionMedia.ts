import { useState, useEffect, useRef } from 'react';
import { useJadeClient, extractMedia, type SessionMetadata, type ConversationEntry } from '@gr33n-ai/jade-sdk-rn-client';
import { getVideoThumbnailUri } from './useVideoThumbnail';

const MAX_CONCURRENT = 5;

export interface SessionMediaInfo {
  heroUrl: string;
  extraUrls: string[];
}

export function useSessionMedia(
  sessions: SessionMetadata[],
  conversationCacheRef: React.MutableRefObject<Map<string, ConversationEntry[]>>,
): Map<string, SessionMediaInfo> {
  const client = useJadeClient();
  const [mediaMap, setMediaMap] = useState<Map<string, SessionMediaInfo>>(new Map());
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;
    if (sessions.length === 0) {
      setMediaMap(new Map());
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      const queue = [...sessions];
      const active: Promise<void>[] = [];

      function processNext(): Promise<void> {
        if (cancelled || queue.length === 0) return Promise.resolve();
        const session = queue.shift()!;

        return (async () => {
          try {
            let conversation = conversationCacheRef.current.get(session.session_id);
            if (!conversation) {
              const response = await client.getSession(session.session_id);
              conversation = response.conversation;
              conversationCacheRef.current.set(session.session_id, conversation);
            }

            if (cancelled || generation !== generationRef.current) return;

            const media = extractMedia(conversation);
            if (media.length === 0) return;

            // SDK returns newest-first; hero = most recent, extras = next newest
            const newest = media[0];
            let heroUrl: string | null = null;

            if (newest.type === 'video') {
              heroUrl = await getVideoThumbnailUri(newest.url);
            } else {
              heroUrl = newest.url;
            }

            if (!heroUrl || cancelled || generation !== generationRef.current) return;

            const extraUrls = media
              .slice(1)
              .filter((m) => m.type === 'image')
              .map((m) => m.url)
              .slice(0, 3);

            setMediaMap(prev => {
              const next = new Map(prev);
              next.set(session.session_id, { heroUrl, extraUrls });
              return next;
            });
          } catch {
            // Silently skip failed fetches
          }

          return processNext();
        })();
      }

      for (let i = 0; i < Math.min(MAX_CONCURRENT, queue.length); i++) {
        active.push(processNext());
      }
      await Promise.all(active);
    }

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [sessions, client, conversationCacheRef]);

  return mediaMap;
}
