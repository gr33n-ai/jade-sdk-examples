import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useJadeClient, type SkillMetadata } from '@gr33n-ai/jade-sdk-rn-client';

interface SkillSection {
  title: string;
  data: SkillMetadata[];
  isOrg?: boolean;
}

export default function SkillsScreen() {
  const navigation = useNavigation();
  const client = useJadeClient();
  const [personalSkills, setPersonalSkills] = useState<SkillMetadata[]>([]);
  const [orgSkills, setOrgSkills] = useState<SkillMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={loadSkills}
            style={styles.headerButton}
            disabled={isLoading}
          >
            <Text style={styles.headerButtonText}>{isLoading ? '...' : '↻'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreate(!showCreate)}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>{showCreate ? '✕' : '+'}</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isLoading, showCreate]);

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
    loadSkills();
  }, [loadSkills]);

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
        style={styles.skillItem}
        onPress={() => toggleExpand(item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.skillContent}>
          <Text style={styles.skillName}>{item.name}</Text>
          <Text style={styles.skillMeta}>
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
        <Text style={styles.expandHint}>
          {expandedSkill === item.name ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
      {expandedSkill === item.name && (
        <View style={styles.expandedContent}>
          <Text style={styles.expandedText}>
            Skill content preview not available
          </Text>
        </View>
      )}
    </View>
  );

  const renderSectionHeader = ({ section }: { section: SkillSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderCreateForm = () => {
    if (!showCreate) return null;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.createForm}
      >
        <Text style={styles.createTitle}>Create New Skill</Text>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="my-skill"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.inputLabel}>Content</Text>
        <TextInput
          style={[styles.input, styles.contentInput]}
          value={newContent}
          onChangeText={setNewContent}
          placeholder="# My Skill&#10;&#10;Description of what this skill does..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!newName.trim() || !newContent.trim() || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!newName.trim() || !newContent.trim() || isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Skill'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.container}>
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
            tintColor="#4a9eff"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No skills yet</Text>
              <Text style={styles.emptyHint}>Tap + to create a skill</Text>
            </View>
          ) : null
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  headerButtonText: {
    color: '#4a9eff',
    fontSize: 20,
    fontWeight: '600',
  },
  createForm: {
    backgroundColor: '#252525',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  createTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  contentInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#4a9eff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
  },
  saveButtonText: {
    color: '#fff',
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
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  skillContent: {
    flex: 1,
  },
  skillName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  skillMeta: {
    color: '#888',
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
    color: '#666',
    fontSize: 12,
  },
  expandedContent: {
    backgroundColor: '#222',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  expandedText: {
    color: '#888',
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
    color: '#888',
    fontSize: 16,
    marginBottom: 4,
  },
  emptyHint: {
    color: '#555',
    fontSize: 14,
  },
});
