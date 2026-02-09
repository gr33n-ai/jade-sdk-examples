import { useState, useEffect } from 'react';
import * as VideoThumbnails from 'expo-video-thumbnails';

const thumbnailCache = new Map<string, string>();

export function useVideoThumbnail(videoUrl: string | undefined): string | null {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(
    videoUrl ? thumbnailCache.get(videoUrl) ?? null : null,
  );

  useEffect(() => {
    if (!videoUrl) return;

    const cached = thumbnailCache.get(videoUrl);
    if (cached) {
      setThumbnailUri(cached);
      return;
    }

    let cancelled = false;

    VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 })
      .then((result) => {
        if (!cancelled) {
          thumbnailCache.set(videoUrl, result.uri);
          setThumbnailUri(result.uri);
        }
      })
      .catch(() => {
        // Thumbnail generation failed — leave as null
      });

    return () => {
      cancelled = true;
    };
  }, [videoUrl]);

  return thumbnailUri;
}

export async function getVideoThumbnailUri(videoUrl: string): Promise<string | null> {
  const cached = thumbnailCache.get(videoUrl);
  if (cached) return cached;

  try {
    const result = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
    thumbnailCache.set(videoUrl, result.uri);
    return result.uri;
  } catch {
    return null;
  }
}
