const MODEL_NAMES: Record<string, string> = {
  'fal-ai/flux-pro/v1.1': 'Flux Pro',
  'fal-ai/flux-pro/v1.1-ultra': 'Flux Pro Ultra',
  'fal-ai/flux/dev': 'Flux Dev',
  'fal-ai/flux/schnell': 'Flux Schnell',
  'fal-ai/flux-lora': 'Flux LoRA',
  'fal-ai/recraft-v3': 'Recraft V3',
  'fal-ai/stable-diffusion-v35-large': 'SD 3.5 Large',
  'fal-ai/aura-flow': 'Aura Flow',
  'fal-ai/minimax-video/video-01': 'MiniMax Video',
  'fal-ai/minimax-video/video-01-live': 'MiniMax Live',
  'fal-ai/kling-video/v1/standard/text-to-video': 'Kling Standard',
  'fal-ai/kling-video/v1.5/pro/text-to-video': 'Kling Pro 1.5',
  'fal-ai/kling-video/v1/pro/text-to-video': 'Kling Pro',
  'fal-ai/hunyuan-video': 'Hunyuan Video',
  'fal-ai/luma-dream-machine': 'Luma Dream',
  'fal-ai/stable-video': 'Stable Video',
  'gpt-image-1': 'GPT Image',
  'dall-e-3': 'DALL·E 3',
};

export function modelDisplayName(modelId?: string): string | undefined {
  if (!modelId) return undefined;
  if (MODEL_NAMES[modelId]) return MODEL_NAMES[modelId];

  // Extract last meaningful segment
  const parts = modelId.split('/');
  const last = parts[parts.length - 1];
  return last
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
