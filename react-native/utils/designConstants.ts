import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Spacing = {
  screenPadding: 28,
  gridGap: 12,
  sectionGap: 15,
  cardPadding: 20,
} as const;

export const CardSize = {
  templateWidth: 185,
  templateHeight: 76,
  sessionHeight: 222,
  mediaHeight: 324,
} as const;

export const CornerRadius = {
  large: 34,
  medium: 18,
  small: 4,
} as const;

export const CardStack = {
  cardOffset: 16,
  maxVisibleCards: 4,
  maxDismissedVisible: 2,
  scaleDecrement: 0.03,
  opacityDecrement: 0.15,
  dismissedPeek: 50,
  dismissedScale: 0.94,
  swipeThreshold: 60,
  velocityThreshold: 300,
  springResponse: 0.42,
  springDamping: 0.84,
} as const;

export const Avatar = {
  size: 33,
} as const;

export const templateCardWidth = () => {
  const available = SCREEN_WIDTH - Spacing.screenPadding * 2;
  return Math.min(CardSize.templateWidth, (available - Spacing.gridGap) / 2);
};
