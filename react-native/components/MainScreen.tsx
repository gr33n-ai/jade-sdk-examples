import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useJadeSession } from '@gr33n-ai/jade-sdk-rn-client';
import type { RootStackParamList } from '../types/navigation';
import ChatScreen from './ChatScreen';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import SkillsScreen from './SkillsScreen';
import { useThemeColors } from '../utils/theme';
import type { ToolCallNodeURI } from './workflow-graph';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'> & {
  onDisconnect: () => void;
};

export default function MainScreen({ navigation, route, onDisconnect }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { clear } = useJadeSession();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [skillsModalVisible, setSkillsModalVisible] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(route.params?.sessionId);
  const [showFullGraph, setShowFullGraph] = useState(false);
  const [focusToolCallId, setFocusToolCallId] = useState<ToolCallNodeURI | undefined>();

  const sidebarOffset = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(sidebarOffset, {
        toValue: sidebarVisible ? SIDEBAR_WIDTH : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: sidebarVisible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sidebarVisible, sidebarOffset, overlayOpacity]);

  const handleMenuPress = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const handleNewSession = useCallback(() => {
    clear();
    setCurrentSessionId(undefined);
  }, [clear]);

  const handleShowFullGraph = useCallback((toolUseId?: string) => {
    if (toolUseId) {
      setFocusToolCallId(`jade://tool/${toolUseId}` as ToolCallNodeURI);
    } else {
      setFocusToolCallId(undefined);
    }
    setShowFullGraph(true);
  }, []);

  const handleCloseFullGraph = useCallback(() => {
    setShowFullGraph(false);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.mainContent,
          { backgroundColor: colors.background, transform: [{ translateX: sidebarOffset }] },
        ]}
      >
        <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.accentBackground, borderColor: colors.accent, borderWidth: 1 }]}
              onPress={handleMenuPress}
            >
              <Text style={[styles.menuIcon, { color: colors.accent }]}>☰</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight} />
        </View>

        <View style={{ flex: 1 }}>
          <ChatScreen
            sessionId={currentSessionId}
            onShowFullGraph={handleShowFullGraph}
            showFullGraph={showFullGraph}
            onCloseFullGraph={handleCloseFullGraph}
            focusToolCallId={focusToolCallId}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.overlay,
          { opacity: overlayOpacity },
        ]}
        pointerEvents={sidebarVisible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseSidebar} />
      </Animated.View>

      <Sidebar
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onManageSkills={() => setSkillsModalVisible(true)}
        onDisconnect={onDisconnect}
        currentSessionId={currentSessionId}
      />

      <SkillsScreen
        visible={skillsModalVisible}
        onClose={() => setSkillsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    zIndex: 1,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
});
