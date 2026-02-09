import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { TemplatePresentation, TemplateParameter } from '../../types/TemplatePresentation';
import { buildTemplatePrompt } from '../../utils/promptMetadata';
import { CornerRadius, Spacing } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';

interface TemplateDetailScreenProps {
  template: TemplatePresentation;
  onBack: () => void;
  onSubmit: (prompt: string, skills: string[]) => void;
}

function hueFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 35%)`;
}

function OptionPillPicker({
  param,
  selectedValue,
  onSelect,
}: {
  param: TemplateParameter;
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const colors = useThemeColors();
  const optionIds = useMemo(() => new Set(param.options?.map((o) => o.id)), [param.options]);
  const isValueCustom = selectedValue !== '' && !optionIds.has(selectedValue);

  const [isCustomActive, setIsCustomActive] = useState(isValueCustom);
  const [customText, setCustomText] = useState(isValueCustom ? selectedValue : '');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isCustomActive) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCustomActive]);

  const handleCustomTap = () => {
    setIsCustomActive(true);
    setCustomText(isValueCustom ? selectedValue : customText);
  };

  const handlePredefinedTap = (id: string) => {
    setIsCustomActive(false);
    onSelect(id);
  };

  const handleCustomChange = (text: string) => {
    setCustomText(text);
    if (text.length > 0) onSelect(text);
  };

  const handleCustomBlur = () => {
    if (customText.trim().length === 0) {
      setIsCustomActive(false);
      if (param.defaultValue) onSelect(param.defaultValue);
    }
  };

  const customSelected = isCustomActive || isValueCustom;

  return (
    <View style={styles.paramSection}>
      <Text style={[styles.paramLabel, { color: colors.textSecondary }]}>
        {param.label}
      </Text>
      <View style={styles.pillRow}>
        {param.options?.map((option) => {
          const isSelected = option.id === selectedValue && !isCustomActive;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected
                    ? colors.accent
                    : colors.backgroundTertiary,
                },
              ]}
              onPress={() => handlePredefinedTap(option.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {isCustomActive ? (
          <View style={[styles.customInputWrapper, { backgroundColor: colors.accent }]}>
            <TextInput
              ref={inputRef}
              style={styles.customInput}
              value={customText}
              onChangeText={handleCustomChange}
              onBlur={handleCustomBlur}
              onSubmitEditing={handleCustomBlur}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => {
                setIsCustomActive(false);
                setCustomText('');
                if (param.defaultValue) onSelect(param.defaultValue);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.customDismiss}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: customSelected
                  ? colors.accent
                  : colors.backgroundTertiary,
              },
            ]}
            onPress={handleCustomTap}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color: customSelected ? '#FFFFFF' : colors.text,
                  fontWeight: customSelected ? '600' : '400',
                },
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TemplateDetailScreen({
  template,
  onBack,
  onSubmit,
}: TemplateDetailScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const heroHeight = screenWidth;
  const [description, setDescription] = useState('');
  const gradientColor = useMemo(
    () => hueFromString(template.id),
    [template.id],
  );

  // Initialize param values with defaults
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const p of template.parameters) {
      if (p.defaultValue) defaults[p.id] = p.defaultValue;
    }
    return defaults;
  });

  const updateParam = (id: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    const prompt = buildTemplatePrompt(
      template,
      description,
      paramValues,
    );
    onSubmit(prompt, [template.skillName]);
  };

  const canSubmit = description.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Overscroll fill — extends gradient color above hero */}
        <View style={[styles.overscrollFill, { backgroundColor: gradientColor }]} />

        {/* Hero */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <LinearGradient
            colors={[gradientColor, '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroContent, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={onBack}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>

            <View style={styles.heroText}>
              <View style={[styles.scopeBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.scopeText}>{template.scope}</Text>
              </View>
              <Text style={styles.heroLabel}>
                {template.displayLabel.toUpperCase()}
              </Text>
              <Text style={styles.heroName}>
                {template.displayArticle
                  ? `${template.displayArticle} ${template.displayName}`
                  : template.displayName}
              </Text>
              {template.description ? (
                <Text style={styles.heroDescription} numberOfLines={3}>
                  {template.description}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Describe what you want
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder={template.inputPlaceholder || 'Describe your vision...'}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Parameters */}
        {template.parameters
          .filter((p) => p.type === 'select' && p.options && p.options.length > 0)
          .map((param) => (
            <OptionPillPicker
              key={param.id}
              param={param}
              selectedValue={paramValues[param.id] ?? ''}
              onSelect={(val) => updateParam(param.id, val)}
            />
          ))}
      </ScrollView>

      {/* Submit */}
      <View style={[styles.submitContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: canSubmit ? colors.accent : colors.backgroundTertiary,
            },
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.submitText,
              { color: canSubmit ? '#FFFFFF' : colors.textMuted },
            ]}
          >
            {template.displayLabel} {template.displayName}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  overscrollFill: {
    position: 'absolute',
    top: -500,
    left: 0,
    right: 0,
    height: 500,
  },
  hero: {
    justifyContent: 'flex-end',
  },
  heroContent: {
    flex: 1,
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.screenPadding + 12,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    marginTop: -2,
  },
  heroText: {
    gap: 6,
  },
  scopeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  scopeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
  },
  heroDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  inputSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 24,
    paddingBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: CornerRadius.medium,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1,
  },
  paramSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 2,
    borderRadius: 20,
    minWidth: 80,
    gap: 6,
  },
  customInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 0,
    minWidth: 40,
  },
  customDismiss: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
  submitContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 12,
  },
  submitButton: {
    borderRadius: CornerRadius.medium,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
