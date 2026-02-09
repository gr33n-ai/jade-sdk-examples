import type { TemplatePresentation, TemplateParameter } from '../types/TemplatePresentation';

export const HIDDEN_PROMPT_PREFIX =
  'The user will not see any of your messages. Any questions or permissions should be given using suggestions. Each suggestion should be a short action phrase that starts with an uppercase letter.';

// --- Building prompts ---

export function buildTemplatePrompt(
  template: TemplatePresentation,
  description: string,
  paramValues: Record<string, string>,
  attachedImageCount: number = 0,
): string {
  const contextParts: string[] = [];
  contextParts.push(`use skill/${template.skillName}`);

  const paramEntries = template.parameters
    .map((p) => {
      const val = paramValues[p.id] ?? p.defaultValue;
      if (!val) return null;
      const label = p.options?.find((o) => o.id === val)?.label ?? val;
      return `${p.label}: ${label}`;
    })
    .filter(Boolean);

  if (paramEntries.length > 0) {
    contextParts.push(`[Parameters: ${paramEntries.join(', ')}]`);
  }

  if (attachedImageCount > 0) {
    contextParts.push(`[Attached ${attachedImageCount} image${attachedImageCount > 1 ? 's' : ''}]`);
  }

  const contextSection = contextParts.join(' ');

  const article = template.displayArticle
    ? `${template.displayArticle} `
    : '';
  const header = `${template.displayLabel} ${article}${template.displayName}.`;

  const userText = description.trim();
  const promptSection = `${header} [user] ${userText}`;

  return `${contextSection}\n\n${promptSection}`;
}

export function buildMessageContext(
  text: string,
  cardIndex: number,
  totalCards: number,
  displayPrompt: string,
  media: { url: string }[],
  currentMediaIndex: number,
): string {
  const contextParts: string[] = [];

  if (totalCards > 1) {
    const truncated = displayPrompt.length > 50
      ? displayPrompt.slice(0, 50) + '...'
      : displayPrompt;
    contextParts.push(
      `[Viewing card ${cardIndex + 1} of ${totalCards}: "${truncated}"]`,
    );
  }

  if (media.length > 1) {
    const item = media[currentMediaIndex] ?? media[0];
    if (item?.url) {
      contextParts.push(
        `[Looking at image ${currentMediaIndex + 1} of ${media.length}: ${item.url}]`,
      );
    }
  } else if (media.length === 1 && media[0]?.url) {
    contextParts.push(`[Referring to image: ${media[0].url}]`);
  }

  if (contextParts.length === 0) return text;
  return contextParts.join(' ') + '\n\n' + text;
}

// --- Stripping for display ---

const SUGGESTION_RE = /<gr3\.suggestion>([\s\S]*?)<\/gr3\.suggestion>/g;

export function stripSuggestions(text: string): {
  clean: string;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  const clean = text.replace(SUGGESTION_RE, (_, content: string) => {
    const trimmed = content.trim();
    if (trimmed.length > 0) {
      suggestions.push(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
    }
    return '';
  }).trim();
  return { clean, suggestions };
}

const TEMPLATE_HEADER_RE =
  /^(Create|Design|Generate|Edit|Extract|Combine|Narrate)\s+(a |an )?[\w\s]+\.\s*/i;
const TRAILING_PARAMS_RE = /\s*(?:\w[\w\s]*:\s*[\w\s/]+(?:,\s*)?)+$/;

const AUTO_PROMPT_RE = /^\[auto-prompt:\s*(.*?)\]$/;
const HIDDEN_PROMPT_DETECT = 'The user will not see any of your messages';

export function stripPromptMetadata(text: string): string {
  let result = text;

  // 1. Remove hidden prompt prefix (substring match for robustness)
  const detectIdx = result.indexOf(HIDDEN_PROMPT_DETECT);
  if (detectIdx >= 0) {
    const nlAfter = result.indexOf('\n\n', detectIdx);
    if (nlAfter >= 0) {
      result = result.slice(nlAfter + 2).trim();
    } else {
      return '';
    }
    if (!result) return '';
  }

  // 2. If starts with context markers, drop everything before first \n\n
  const hasPrefix =
    result.startsWith('[') ||
    result.startsWith('use skill/') ||
    result.startsWith('use workflow/');
  if (!hasPrefix) return result || text;

  const nlIndex = result.indexOf('\n\n');
  if (nlIndex >= 0) {
    result = result.slice(nlIndex + 2);
  } else {
    return '';
  }

  if (!result.trim()) return text;
  const autoMatch = result.trim().match(AUTO_PROMPT_RE);
  if (autoMatch) return autoMatch[1] || '';

  // 3. If contains [user] marker, extract user text
  const userMarker = '[user] ';
  const userIdx = result.indexOf(userMarker);
  if (userIdx >= 0) {
    let userText = result.slice(userIdx + userMarker.length).trim();
    userText = userText.replace(TRAILING_PARAMS_RE, '').trim();
    if (userText) return userText;
  }

  // 4. Fallback: strip known template header pattern
  let stripped = result.replace(TEMPLATE_HEADER_RE, '').trim();
  stripped = stripped.replace(TRAILING_PARAMS_RE, '').trim();
  if (stripped) return stripped;

  // 5. If all stripping produced empty string, return post-\n\n text
  return result.trim() || text;
}
