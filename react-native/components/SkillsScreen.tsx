import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  SectionList,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJadeClient, type SkillMetadata } from '@gr33n-ai/jade-sdk-rn-client';
import { useThemeColors } from '../utils/theme';

interface SkillSection {
  title: string;
  data: SkillMetadata[];
  isOrg?: boolean;
}

interface SkillsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function SkillsScreen({ visible, onClose }: SkillsScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const client = useJadeClient();
  const [personalSkills, setPersonalSkills] = useState<SkillMetadata[]>([]);
  const [orgSkills, setOrgSkills] = useState<SkillMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadSkills = useCallback(async () => {
    try {
      setIsLoading(true);
      const [personalResult, orgResult] = await Promise.all([
        client.listSkills(),
        client.hasOrgContext ? client.listOrgSkills().catch(() => ({ skills: [] })) : Promise.resolve({ skills: [] }),
      ]);
      setPersonalSkills(personalResult.skills);
      setOrgSkills(orgResult.skills);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (visible) {
      loadSkills();
    }
  }, [visible, loadSkills]);

  const handleDelete = async (name: string) => {
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.deleteSkill(name);
              setPersonalSkills((prev) => prev.filter((s) => s.name !== name));
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete skill');
            }
          },
        },
      ]
    );
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newContent.trim()) {
      Alert.alert('Error', 'Name and content are required');
      return;
    }

    setIsSaving(true);
    try {
      const encoder = new TextEncoder();
      const contentBytes = encoder.encode(newContent);
      await client.saveSkill({ name: newName.trim(), content: contentBytes });
      setNewName('');
      setNewContent('');
      setShowCreate(false);
      await loadSkills();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save skill');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpand = (name: string) => {
    setExpandedSkill(expandedSkill === name ? null : name);
  };

  const sections: SkillSection[] = [];
  if (personalSkills.length > 0) {
    sections.push({ title: `Personal (${personalSkills.length})`, data: personalSkills });
  }
  if (orgSkills.length > 0) {
    sections.push({ title: `Organization (${orgSkills.length})`, data: orgSkills, isOrg: true });
  }

  const renderItem = ({ item, section }: { item: SkillMetadata; section: SkillSection }) => (
    <View>
      <TouchableOpacity
        style={[styles.skillItem, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => toggleExpand(item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.skillContent}>
          <Text style={[styles.skillName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.skillMeta, { color: colors.textSecondary }]}>
            {item.checksum?.slice(0, 8) || 'No checksum'}
          </Text>
        </View>
        {!section.isOrg && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.name)}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.expandHint, { color: colors.textMuted }]}>
          {expandedSkill === item.name ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
      {expandedSkill === item.name && (
        <View style={[styles.expandedContent, { backgroundColor: colors.expandedBackground }]}>
          <Text style={[styles.expandedText, { color: colors.textSecondary }]}>
            Skill content preview not available
          </Text>
        </View>
      )}
    </View>
  );

  const renderSectionHeader = ({ section }: { section: SkillSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
    </View>
  );

  const renderCreateForm = () => {
    if (!showCreate) return null;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.createForm, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}
      >
        <Text style={[styles.createTitle, { color: colors.text }]}>Create New Skill</Text>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={newName}
          onChangeText={setNewName}
          placeholder="my-skill"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Content</Text>
        <TextInput
          style={[styles.input, styles.contentInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={newContent}
          onChangeText={setNewContent}
          placeholder="# My Skill&#10;&#10;Description of what this skill does..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.accent },
            (!newName.trim() || !newContent.trim() || isSaving) && { backgroundColor: colors.backgroundTertiary },
          ]}
          onPress={handleCreate}
          disabled={!newName.trim() || !newContent.trim() || isSaving}
        >
          <Text style={[styles.saveButtonText, { color: colors.userBubbleText }]}>
            {isSaving ? 'Saving...' : 'Save Skill'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.circleButton, { backgroundColor: colors.accentBackground, borderColor: colors.accent, borderWidth: 1 }]}
            >
              <Text style={[styles.buttonIcon, { color: colors.accent }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Skills</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={loadSkills}
              style={[styles.circleButton, { backgroundColor: colors.accentBackground, borderColor: colors.accent, borderWidth: 1 }]}
              disabled={isLoading}
            >
              <Text style={[styles.buttonIcon, { color: colors.accent }]}>{isLoading ? '...' : '↻'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCreate(!showCreate)}
              style={[styles.circleButton, { backgroundColor: colors.accentBackground, borderColor: colors.accent, borderWidth: 1 }]}
            >
              <Text style={[styles.buttonIcon, { color: colors.accent }]}>{showCreate ? '✕' : '+'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderCreateForm()}
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadSkills}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No skills yet</Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Tap + to create a skill</Text>
              </View>
            ) : null
          }
          stickySectionHeadersEnabled={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    position: 'relative',
  },
  headerLeft: {
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 28,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 18,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  createForm: {
    padding: 16,
    borderBottomWidth: 1,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  contentInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  saveButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  skillContent: {
    flex: 1,
  },
  skillName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  skillMeta: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actionButton: {
    padding: 4,
    marginRight: 8,
  },
  actionIcon: {
    fontSize: 16,
  },
  expandHint: {
    fontSize: 12,
  },
  expandedContent: {
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  expandedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
  },
});
