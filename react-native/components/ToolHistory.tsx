import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import { getHumanReadableToolName } from '../utils/toolNames';

interface Props {
  entries: ProcessedEntry[];
  onScrollToEntry?: (index: number) => void;
}

interface ToolCallInfo {
  index: number;
  name: string;
  displayName: string;
}

export default function ToolHistory({ entries, onScrollToEntry }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toolCalls = useMemo(() => {
    const calls: ToolCallInfo[] = [];
    entries.forEach((entry, index) => {
      const type = entry.originalType || entry.entry?.type;
      if (type === 'tool_call') {
        const rawName = (entry.data?.toolName as string) || entry.entry?.tool_name || 'Tool';
        calls.push({
          index,
          name: rawName,
          displayName: getHumanReadableToolName(rawName),
        });
      }
    });
    return calls;
  }, [entries]);

  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>{isExpanded ? '▼' : '▶'}</Text>
          <Text style={styles.headerText}>
            {toolCalls.length} tool{toolCalls.length !== 1 ? 's' : ''} used
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.expandedContent} nestedScrollEnabled>
          {toolCalls.map((tool) => (
            <TouchableOpacity
              key={tool.index}
              style={styles.toolItem}
              onPress={() => onScrollToEntry?.(tool.index)}
              activeOpacity={0.7}
            >
              <Text style={styles.toolName}>{tool.displayName}</Text>
              <Text style={styles.toolArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    color: '#666',
    fontSize: 10,
    marginRight: 8,
  },
  headerText: {
    color: '#888',
    fontSize: 13,
  },
  expandedContent: {
    maxHeight: 200,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e3a5f',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  toolName: {
    color: '#4a9eff',
    fontSize: 13,
    fontWeight: '500',
  },
  toolArrow: {
    color: '#4a9eff',
    fontSize: 12,
  },
});
