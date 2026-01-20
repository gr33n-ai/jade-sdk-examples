import React from 'react';
import type { ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import { getToolUI } from './registry';

interface Props {
  entry: ProcessedEntry;
  toolName: string;
}

export function ToolUI({ entry, toolName }: Props) {
  const Component = getToolUI(toolName);
  if (!Component) return null;
  return <Component entry={entry} toolName={toolName} />;
}
