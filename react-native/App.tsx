import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  JadeProvider,
  createAsyncStorageAdapter,
  STORAGE_KEYS,
} from '@gr33n-ai/jade-sdk-rn-client';

import ConfigScreen from './components/ConfigScreen';
import MainScreen from './components/MainScreen';
import type { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const storage = createAsyncStorageAdapter(AsyncStorage);

const getDefaultEndpoint = () => {
  return 'https://api.gr33n.ai';
};

const getDefaultToken = () => {
  return Constants.expoConfig?.extra?.defaultAuthToken || '';
};

interface Config {
  endpoint: string;
  token: string;
  orgId: string;
}

export default function App() {
  const colorScheme = useColorScheme();
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [endpoint, token, orgId] = await Promise.all([
          storage.getItem(STORAGE_KEYS.ENDPOINT),
          storage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          storage.getItem(STORAGE_KEYS.ORG_ID),
        ]);
        if (endpoint) {
          setConfig({ endpoint, token: token || '', orgId: orgId || '' });
        }
      } catch {
        // Config not found, will show config screen
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleConnect = useCallback(async (endpoint: string, token: string, orgId: string) => {
    await Promise.all([
      storage.setItem(STORAGE_KEYS.ENDPOINT, endpoint),
      storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
      storage.setItem(STORAGE_KEYS.ORG_ID, orgId),
    ]);
    setConfig({ endpoint, token, orgId });
  }, []);

  const handleDisconnect = useCallback(async () => {
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.ENDPOINT),
      storage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      storage.removeItem(STORAGE_KEYS.ORG_ID),
    ]);
    setConfig(null);
  }, []);

  const getAuthToken = useCallback(async () => {
    return config?.token || null;
  }, [config?.token]);

  const providerConfig = useMemo(
    () => ({
      endpoint: config?.endpoint || getDefaultEndpoint(),
      getAuthToken,
      orgId: config?.orgId || undefined,
    }),
    [config?.endpoint, config?.orgId, getAuthToken]
  );

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <NavigationContainer>
          {!config ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Config">
                {(props) => (
                  <ConfigScreen
                    {...props}
                    defaultEndpoint={getDefaultEndpoint()}
                    defaultToken={getDefaultToken()}
                    onConnect={handleConnect}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          ) : (
            <JadeProvider config={providerConfig} storage={storage}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main">
                  {(props) => (
                    <MainScreen
                      {...props}
                      onDisconnect={handleDisconnect}
                    />
                  )}
                </Stack.Screen>
              </Stack.Navigator>
            </JadeProvider>
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
