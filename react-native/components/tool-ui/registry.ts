import type { ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import type { ComponentType } from 'react';

export interface ToolUIProps {
  entry: ProcessedEntry;
  toolName: string;
}

type ToolUIComponent = ComponentType<ToolUIProps>;

const toolUIRegistry: Record<string, ToolUIComponent> = {};

export function registerToolUI(toolName: string, component: ToolUIComponent) {
  toolUIRegistry[toolName] = component;
}

export function getToolUI(toolName: string): ToolUIComponent | null {
  return toolUIRegistry[toolName] || null;
}
