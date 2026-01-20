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

type Props = NativeStackScreenProps<RootStackParamList, 'Config'> & {
  defaultEndpoint: string;
  defaultToken: string;
  onConnect: (endpoint: string, token: string, orgId: string) => Promise<void>;
};

export default function ConfigScreen({ defaultEndpoint, defaultToken, onConnect }: Props) {
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Jade SDK</Text>
          <Text style={styles.subtitle}>React Native Playground</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Server Endpoint</Text>
          <TextInput
            style={styles.input}
            value={endpoint}
            onChangeText={setEndpoint}
            placeholder="https://api.gr33n.ai"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>Auth Token</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Bearer token"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <Text style={styles.label}>Org ID (optional)</Text>
          <TextInput
            style={styles.input}
            value={orgId}
            onChangeText={setOrgId}
            placeholder="Organization ID for org skills"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, isConnecting && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            <Text style={styles.buttonText}>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Start the jade-server on your machine and connect to begin.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  error: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4a9eff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});
