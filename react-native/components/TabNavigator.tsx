import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../types/navigation';
export type { TabParamList } from '../types/navigation';
import SessionsScreen from './SessionsScreen';
import ChatScreen from './ChatScreen';
import SkillsScreen from './SkillsScreen';
import MoreScreen from './MoreScreen';

const Tab = createBottomTabNavigator<TabParamList>();

interface Props {
  onDisconnect: () => void;
}

export default function TabNavigator({ onDisconnect }: Props) {
  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a1a' },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#4a9eff',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Sessions"
        component={SessionsScreen}
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 20, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Jade SDK',
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 20, color }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Skills"
        component={SkillsScreen}
        options={{
          title: 'Skills',
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 20, color }}>📚</Text>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        options={{
          title: 'More',
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 20, color }}>⋯</Text>
          ),
        }}
      >
        {(props: BottomTabScreenProps<TabParamList, 'More'>) => (
          <MoreScreen {...props} onDisconnect={onDisconnect} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
