import { getToolDefinition } from '@gr33n-ai/jade-sdk-rn-client';

/**
 * Get a human-readable display name for a tool.
 * Uses the tool registry's displayName if available, otherwise cleans up the tool name.
 */
export function getHumanReadableToolName(toolName: string): string {
  const definition = getToolDefinition(toolName);
  if (definition?.displayName) {
    return definition.displayName;
  }

  // Fallback: clean up tool name
  return toolName
    .replace(/^mcp__jade__/, '')
    .replace(/^mcp__olive__/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
