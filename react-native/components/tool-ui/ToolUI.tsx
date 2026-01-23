import React from 'react';
import type { ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import { getToolUI } from './registry';

interface Props {
  entry: ProcessedEntry;
  toolName: string;
  isCollapsed?: boolean;
  onShowFullGraph?: () => void;
}

export function ToolUI({ entry, toolName, isCollapsed, onShowFullGraph }: Props) {
  const Component = getToolUI(toolName);
  if (!Component) return null;
  return <Component entry={entry} toolName={toolName} isCollapsed={isCollapsed} onShowFullGraph={onShowFullGraph} />;
}
