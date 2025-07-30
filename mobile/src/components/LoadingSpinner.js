import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoadingSpinner({ message = 'Loading...' }) {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      marginTop: 16,
      color: theme.colors.onSurfaceVariant,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </SafeAreaView>
  );
}