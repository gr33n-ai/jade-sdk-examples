import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useThemeColors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Config'> & {
  defaultEndpoint: string;
  defaultToken: string;
  onConnect: (endpoint: string, token: string, orgId: string) => Promise<void>;
};

export default function ConfigScreen({ defaultEndpoint, defaultToken, onConnect }: Props) {
  const colors = useThemeColors();
  const [endpoint, setEndpoint] = useState(defaultEndpoint);
  const [token, setToken] = useState(defaultToken);
  const [orgId, setOrgId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!endpoint.trim()) {
      setError('Endpoint is required');
      return;
    }

    if (!token.trim()) {
      setError('Auth token is required');
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      await onConnect(endpoint.trim(), token, orgId.trim());
    } catch (err) {
      setError(
        err instanceof Error
          ? `Connection failed: ${err.message}`
          : 'Connection failed'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Jade SDK</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>React Native Playground</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Server Endpoint</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
            value={endpoint}
            onChangeText={setEndpoint}
            placeholder="https://api.gr33n.ai"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Auth Token</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
            value={token}
            onChangeText={setToken}
            placeholder="Bearer token"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Org ID (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
            value={orgId}
            onChangeText={setOrgId}
            placeholder="Organization ID for org skills"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }, isConnecting && { backgroundColor: colors.backgroundTertiary }]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            <Text style={[styles.buttonText, { color: colors.userBubbleText }]}>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Start the jade-server on your machine and connect to begin.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
  },
});
