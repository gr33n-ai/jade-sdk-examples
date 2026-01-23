/**
 * FullGraphView - Full-screen modal showing complete session workflow
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import type { ProcessedEntry } from '@gr33n-ai/jade-sdk-rn-client';
import type { LayoutedNode, AssetNode, ToolCallNode, ToolCallNodeURI } from './types';
import { GRAPH_COLORS } from './types';
import { buildWorkflowGraph } from './mobile-graph-builder';
import { layoutFullGraph } from './mobile-layout';
import { GraphCanvas } from './GraphCanvas';

interface FullGraphViewProps {
  visible: boolean;
  onClose: () => void;
  entries: ProcessedEntry[];
  sessionId: string;
  focusToolCallId?: ToolCallNodeURI;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function FullGraphView({
  visible,
  onClose,
  entries,
  sessionId,
  focusToolCallId,
}: FullGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<LayoutedNode | null>(null);

  const graph = useMemo(
    () => buildWorkflowGraph(entries, sessionId),
    [entries, sessionId]
  );

  const layout = useMemo(() => layoutFullGraph(graph), [graph]);

  const handleNodePress = (node: LayoutedNode) => {
    setSelectedNode(node);
  };

  const handleCloseDetails = () => {
    setSelectedNode(null);
  };

  if (graph.metadata.assetCount === 0 && graph.metadata.toolCount === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Session Workflow</Text>
            <Text style={styles.subtitle}>
              {graph.metadata.toolCount} tools • {graph.metadata.assetCount} assets
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Graph Canvas */}
        <GraphCanvas
          layout={layout}
          onNodePress={handleNodePress}
          initialScrollToNode={focusToolCallId}
        />

        {/* Node Details Bottom Sheet */}
        {selectedNode && (
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <TouchableOpacity
              style={styles.bottomSheetClose}
              onPress={handleCloseDetails}
            >
              <Text style={styles.bottomSheetCloseText}>✕</Text>
            </TouchableOpacity>

            <NodeDetails node={selectedNode} />
          </View>
        )}
      </View>
    </Modal>
  );
}

interface NodeDetailsProps {
  node: LayoutedNode;
}

function NodeDetails({ node }: NodeDetailsProps) {
  if (node.type === 'asset') {
    const asset = node.data as AssetNode;
    const isMedia = asset.assetType === 'image' || asset.assetType === 'video';

    return (
      <View style={styles.detailsContent}>
        {isMedia && asset.url && (
          <Image
            source={{ uri: asset.url }}
            style={styles.detailsImage}
            contentFit="contain"
          />
        )}

        <View style={styles.detailsInfo}>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Type</Text>
            <Text style={styles.detailsValue}>{formatAssetType(asset.assetType)}</Text>
          </View>

          {asset.assetType === 'text_prompt' && asset.content && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Content</Text>
              <Text style={styles.detailsPrompt} numberOfLines={4}>
                {asset.content}
              </Text>
            </View>
          )}

          {asset.producedBy && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Produced by</Text>
              <Text style={styles.detailsValue}>Tool</Text>
            </View>
          )}

          {asset.usedBy.length > 0 && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Used by</Text>
              <Text style={styles.detailsValue}>{asset.usedBy.length} tool(s)</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  const tool = node.data as ToolCallNode;
  return (
    <View style={styles.detailsContent}>
      <View style={styles.detailsInfo}>
        <View style={styles.detailsRow}>
          <Text style={styles.detailsLabel}>Tool</Text>
          <Text style={styles.detailsValue}>{formatToolName(tool.toolName)}</Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailsLabel}>Inputs</Text>
          <Text style={styles.detailsValue}>{tool.inputs.length}</Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailsLabel}>Outputs</Text>
          <Text style={styles.detailsValue}>{tool.outputs.length}</Text>
        </View>

        {tool.params && Object.keys(tool.params).length > 0 && (
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Parameters</Text>
            <Text style={styles.detailsParams}>
              {Object.entries(tool.params)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${String(v)}`)
                .join('\n')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function formatAssetType(type: string): string {
  switch (type) {
    case 'text_prompt':
      return 'Text Prompt';
    case 'image':
      return 'Image';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'external':
      return 'External Import';
    default:
      return type;
  }
}

function formatToolName(toolName: string): string {
  const name = toolName.replace('mcp__jade__', '');
  return name.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAPH_COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: GRAPH_COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerInfo: {},
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GRAPH_COLORS.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: SCREEN_HEIGHT * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetClose: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetCloseText: {
    color: '#fff',
    fontSize: 14,
  },
  detailsContent: {
    padding: 16,
  },
  detailsImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#000',
  },
  detailsInfo: {
    gap: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    flex: 0.35,
  },
  detailsValue: {
    color: GRAPH_COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
    flex: 0.65,
    textAlign: 'right',
  },
  detailsPrompt: {
    color: '#fff',
    fontSize: 12,
    flex: 0.65,
    textAlign: 'right',
    lineHeight: 16,
  },
  detailsParams: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    flex: 0.65,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
});

export default FullGraphView;
