import type { ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import type { ComponentType } from 'react';

export interface ToolUIProps {
  entry: ProcessedEntry;
  toolName: string;
  isCollapsed?: boolean;
  onShowFullGraph?: () => void;
}

export interface CollapsedSummaryProps {
  entry: ProcessedEntry;
}

type ToolUIComponent = ComponentType<ToolUIProps>;
type CollapsedSummaryComponent = ComponentType<CollapsedSummaryProps>;

interface ToolMetadata {
  defaultCollapsed: boolean;
}

const toolUIRegistry: Record<string, ToolUIComponent> = {};
const collapsedSummaryRegistry: Record<string, CollapsedSummaryComponent> = {};
const toolMetadataRegistry: Record<string, ToolMetadata> = {};

export function registerToolUI(
  toolName: string,
  component: ToolUIComponent,
  options?: { defaultCollapsed?: boolean }
) {
  toolUIRegistry[toolName] = component;
  toolMetadataRegistry[toolName] = {
    defaultCollapsed: options?.defaultCollapsed ?? true,
  };
}

export function registerCollapsedSummary(
  toolName: string,
  component: CollapsedSummaryComponent
) {
  collapsedSummaryRegistry[toolName] = component;
}

export function getToolUI(toolName: string): ToolUIComponent | null {
  return toolUIRegistry[toolName] || null;
}

export function getCollapsedSummary(toolName: string): CollapsedSummaryComponent | null {
  return collapsedSummaryRegistry[toolName] || null;
}

export function shouldDefaultCollapsed(toolName: string): boolean {
  const metadata = toolMetadataRegistry[toolName];
  return metadata?.defaultCollapsed ?? true;
}
