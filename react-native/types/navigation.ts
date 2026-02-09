import type { TemplatePresentation } from './TemplatePresentation';

export type RootStackParamList = {
  Config: undefined;
  Main: { sessionId?: string };
  TemplateDetail: { template: TemplatePresentation };
};

export type MainScreenParams = {
  sessionId?: string;
};
