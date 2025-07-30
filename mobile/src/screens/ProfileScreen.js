import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        User profile and settings will be implemented here
      </Text>
    </SafeAreaView>
  );
}