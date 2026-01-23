export { ToolUI } from './ToolUI';
export {
  registerToolUI,
  getToolUI,
  registerCollapsedSummary,
  getCollapsedSummary,
  shouldDefaultCollapsed,
  type ToolUIProps,
  type CollapsedSummaryProps,
} from './registry';

import { registerToolUI, registerCollapsedSummary } from './registry';
import { GenerativeImageToolUI } from './GenerativeImageToolUI';
import { TodoWriteToolUI } from './TodoWriteToolUI';
import { TodoCollapsedSummary } from './TodoCollapsedSummary';
import { BashToolUI } from './BashToolUI';
import { BashCollapsedSummary } from './BashCollapsedSummary';

registerToolUI('mcp__jade__generative_image', GenerativeImageToolUI, { defaultCollapsed: false });
registerToolUI('TodoWrite', TodoWriteToolUI);
registerCollapsedSummary('TodoWrite', TodoCollapsedSummary);
registerToolUI('Bash', BashToolUI);
registerCollapsedSummary('Bash', BashCollapsedSummary);
