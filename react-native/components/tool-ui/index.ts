export { ToolUI } from './ToolUI';
export { registerToolUI, getToolUI, type ToolUIProps } from './registry';

import { registerToolUI } from './registry';
import { GenerativeImageToolUI } from './GenerativeImageToolUI';

registerToolUI('mcp__jade__generative_image', GenerativeImageToolUI);
