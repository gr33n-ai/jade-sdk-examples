import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<TabParamList, 'More'> & {
  onDisconnect: () => void;
};

export default function MoreScreen({ onDisconnect }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.row} onPress={onDisconnect}>
          <Text style={styles.rowTextDestructive}>Disconnect</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  rowTextDestructive: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ff6b6b',
  },
});
