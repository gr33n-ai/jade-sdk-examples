import { useColorScheme } from 'react-native';

export const colors = {
  light: {
    background: '#F7F7F7',
    backgroundSecondary: '#EEEEEE',
    backgroundTertiary: '#E0E0E0',
    text: '#000000',
    textSecondary: '#666666',
    textMuted: '#999999',
    accent: '#00C98A',
    accentDimmed: '#006B4F',
    accentBackground: 'rgba(0, 201, 138, 0.15)',
    border: '#D0D0D0',
    // Semantic
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    errorLight: '#FCA5A5',
    // Bubbles
    userBubble: '#00C98A',
    userBubbleText: '#FFFFFF',
    toolBubble: '#E0F0EB',
    resultBubble: '#E0F0E0',
    errorBubble: '#FEE2E2',
    summaryBubble: '#E0E0E0',
    errorMessageBubble: '#FEE2E2',
    // Code
    codeBackground: '#EBEBEB',
    codeText: '#059669',
    fenceText: '#374151',
    // Expanded content
    expandedBackground: '#E8E8E8',
    // Glass effects
    glassTint: 'rgba(247, 247, 247, 0.7)',
    glassBackground: 'rgba(238, 238, 238, 0.95)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.3)',
    // Card stack
    cardBackground: '#FFFFFF',
    cardText: '#313131',
    cardTextSecondary: 'rgba(49, 49, 49, 0.5)',
    suggestionPill: '#F0F0F0',
    suggestionPillText: '#313131',
    templateOverlay: 'rgba(0, 0, 0, 0.35)',
  },
  dark: {
    background: '#1a1a1a',
    backgroundSecondary: '#2a2a2a',
    backgroundTertiary: '#333333',
    text: '#FFFFFF',
    textSecondary: '#888888',
    textMuted: '#666666',
    accent: '#00FFB2',
    accentDimmed: '#006B4F',
    accentBackground: 'rgba(0, 255, 178, 0.15)',
    border: '#333333',
    // Semantic
    success: '#4ade80',
    warning: '#FBBF24',
    error: '#ff6b6b',
    errorLight: '#ff9999',
    // Bubbles
    userBubble: '#00FFB2',
    userBubbleText: '#000000',
    toolBubble: '#1e3a5f',
    resultBubble: '#1a3d1a',
    errorBubble: '#3d1a1a',
    summaryBubble: '#333333',
    errorMessageBubble: '#4a1a1a',
    // Code
    codeBackground: '#333333',
    codeText: '#4ade80',
    fenceText: '#e0e0e0',
    // Expanded content
    expandedBackground: '#222222',
    // Glass effects
    glassTint: 'rgba(50, 50, 50, 0.7)',
    glassBackground: 'rgba(30, 30, 30, 0.95)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    // Card stack
    cardBackground: '#2a2a2a',
    cardText: '#E0E0E0',
    cardTextSecondary: 'rgba(224, 224, 224, 0.5)',
    suggestionPill: '#333333',
    suggestionPillText: '#E0E0E0',
    templateOverlay: 'rgba(0, 0, 0, 0.45)',
  },
};

export type ThemeColors = typeof colors.dark;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'light' ? colors.light : colors.dark;
}
