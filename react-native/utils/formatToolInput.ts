/**
 * Formats tool input for human-readable display.
 * Instead of showing raw JSON like { "prompt": "..." }, shows a cleaner format.
 */

const IMAGE_VIDEO_TOOLS = [
  'generate_image',
  'generate_images',
  'generate_video',
  'edit_image',
  'image_to_video',
  'generative_image',
  'generative_video',
];

const SEARCH_TOOLS = ['search', 'web_search', 'search_web'];

export function formatToolInput(
  toolName: string,
  input: unknown
): string {
  if (!input) return '';

  const rawName = toolName.toLowerCase().replace(/-/g, '_');

  let parsed: Record<string, unknown>;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return input.length > 150 ? input.slice(0, 150) + '...' : input;
    }
  } else if (typeof input === 'object' && input !== null) {
    parsed = input as Record<string, unknown>;
  } else {
    return String(input);
  }

  if (IMAGE_VIDEO_TOOLS.some((t) => rawName.includes(t))) {
    const prompt = parsed.prompt || parsed.image_prompt || parsed.text;
    if (typeof prompt === 'string') {
      const truncated = prompt.length > 150 ? prompt.slice(0, 150) + '...' : prompt;
      return `"${truncated}"`;
    }
  }

  if (SEARCH_TOOLS.some((t) => rawName.includes(t))) {
    const query = parsed.query || parsed.search_query || parsed.q;
    if (typeof query === 'string') {
      return `Search: ${query}`;
    }
  }

  const meaningfulKeys = ['prompt', 'query', 'text', 'message', 'content', 'url', 'path', 'name'];
  for (const key of meaningfulKeys) {
    if (parsed[key] && typeof parsed[key] === 'string') {
      const value = parsed[key] as string;
      const truncated = value.length > 100 ? value.slice(0, 100) + '...' : value;
      return `${key}: "${truncated}"`;
    }
  }

  const keys = Object.keys(parsed);
  if (keys.length === 1) {
    const value = parsed[keys[0]];
    if (typeof value === 'string') {
      const truncated = value.length > 100 ? value.slice(0, 100) + '...' : value;
      return `${keys[0]}: "${truncated}"`;
    }
  }

  const jsonStr = JSON.stringify(parsed);
  return jsonStr.length > 150 ? jsonStr.slice(0, 150) + '...' : jsonStr;
}
