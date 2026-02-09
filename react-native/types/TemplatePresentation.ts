export interface ParameterOption {
  id: string;
  label: string;
}

export interface TemplateParameter {
  id: string;
  type: 'select' | 'text';
  label: string;
  description?: string;
  options?: ParameterOption[];
  defaultValue?: string;
}

export type TemplateScope = 'curated' | 'personal' | 'org';

export interface TemplatePresentation {
  id: string;
  displayName: string;
  displayLabel: string;
  displayArticle: string;
  inputPlaceholder?: string;
  imageURL?: string;
  description: string;
  scope: TemplateScope;
  skillName: string;
  parameters: TemplateParameter[];
}

// --- Shared parameters ---

const sampleDuration: TemplateParameter = {
  id: 'duration',
  type: 'select',
  label: 'Duration',
  options: [
    { id: '5s', label: '5 seconds' },
    { id: '10s', label: '10 seconds' },
    { id: '30s', label: '30 seconds' },
  ],
  defaultValue: '5s',
};

const sampleAspectRatio: TemplateParameter = {
  id: 'aspect_ratio',
  type: 'select',
  label: 'Aspect Ratio',
  options: [
    { id: '16:9', label: '16:9' },
    { id: '9:16', label: '9:16' },
    { id: '1:1', label: '1:1' },
  ],
  defaultValue: '16:9',
};

// --- Demo templates ---

export const demoTemplates: TemplatePresentation[] = [
  {
    id: 'demo-music-video',
    displayName: 'music video',
    displayLabel: 'Create',
    displayArticle: 'a',
    description:
      'Generate a cinematic music video with AI visuals synced to your track.',
    scope: 'curated',
    skillName: 'music-video-production',
    parameters: [sampleDuration, sampleAspectRatio],
  },
  {
    id: 'demo-product-shot',
    displayName: 'product shot',
    displayLabel: 'Generate',
    displayArticle: 'a',
    description:
      'Create studio-quality product photography with controlled lighting and backgrounds.',
    scope: 'curated',
    skillName: 'product-photography',
    parameters: [
      {
        id: 'style',
        type: 'select',
        label: 'Style',
        options: [
          { id: 'minimal', label: 'Minimal' },
          { id: 'lifestyle', label: 'Lifestyle' },
          { id: 'dramatic', label: 'Dramatic' },
        ],
        defaultValue: 'minimal',
      },
      sampleAspectRatio,
    ],
  },
  {
    id: 'demo-social-clip',
    displayName: 'social clip',
    displayLabel: 'Create',
    displayArticle: 'a',
    description:
      'Turn long-form video into short, engaging clips optimized for social platforms.',
    scope: 'curated',
    skillName: 'social-clip-generator',
    parameters: [
      {
        id: 'platform',
        type: 'select',
        label: 'Platform',
        options: [
          { id: 'tiktok', label: 'TikTok' },
          { id: 'reels', label: 'Reels' },
          { id: 'shorts', label: 'Shorts' },
        ],
        defaultValue: 'reels',
      },
      {
        id: 'clips',
        type: 'select',
        label: 'Clips',
        options: [
          { id: '3', label: '3 clips' },
          { id: '5', label: '5 clips' },
          { id: '10', label: '10 clips' },
        ],
        defaultValue: '5',
      },
    ],
  },
  {
    id: 'demo-album-cover',
    displayName: 'album cover',
    displayLabel: 'Design',
    displayArticle: 'an',
    description:
      'Design original album artwork that captures the mood and genre of your music.',
    scope: 'curated',
    skillName: 'album-art-generator',
    parameters: [
      {
        id: 'genre',
        type: 'select',
        label: 'Genre',
        options: [
          { id: 'hiphop', label: 'Hip-Hop' },
          { id: 'electronic', label: 'Electronic' },
          { id: 'indie', label: 'Indie' },
          { id: 'pop', label: 'Pop' },
        ],
        defaultValue: 'hiphop',
      },
    ],
  },
  {
    id: 'demo-brand-kit',
    displayName: 'brand kit',
    displayLabel: 'Design',
    displayArticle: 'a',
    description:
      'Generate a cohesive brand identity with logo variations, color palette, and typography.',
    scope: 'curated',
    skillName: 'brand-kit-generator',
    parameters: [],
  },
  {
    id: 'demo-animated-logo',
    displayName: 'animated logo',
    displayLabel: 'Create',
    displayArticle: 'an',
    description: 'Bring your logo to life with a short motion graphic intro.',
    scope: 'curated',
    skillName: 'logo-animation',
    parameters: [sampleDuration],
  },
  {
    id: 'demo-bts',
    displayName: 'behind the scenes',
    displayLabel: 'Create',
    displayArticle: '',
    description:
      'Transform raw footage into a polished behind-the-scenes edit with captions and music.',
    scope: 'curated',
    skillName: 'bts-editor',
    parameters: [sampleDuration, sampleAspectRatio],
  },
  {
    id: 'demo-event-recap',
    displayName: 'event recap',
    displayLabel: 'Create',
    displayArticle: 'an',
    description:
      'Compile event photos and clips into a dynamic highlight reel.',
    scope: 'curated',
    skillName: 'event-recap-generator',
    parameters: [
      sampleDuration,
      {
        id: 'mood',
        type: 'select',
        label: 'Mood',
        options: [
          { id: 'energetic', label: 'Energetic' },
          { id: 'chill', label: 'Chill' },
          { id: 'cinematic', label: 'Cinematic' },
        ],
        defaultValue: 'energetic',
      },
    ],
  },
];

export function templateFromSkill(
  skill: { name: string },
  scope: TemplateScope,
): TemplatePresentation {
  const displayName = skill.name
    .replace(/-/g, ' ')
    .replace(/_/g, ' ');

  return {
    id: `${scope}-${skill.name}`,
    displayName,
    displayLabel: 'Use',
    displayArticle: 'a',
    description: '',
    scope,
    skillName: skill.name,
    parameters: [],
  };
}
