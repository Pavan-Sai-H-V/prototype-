import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../utils/theme';

export default function ErrorMessage({ 
  message = 'Something went wrong', 
  onRetry,
  showRetry = true 
}) {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    card: {
      padding: spacing.lg,
      alignItems: 'center',
      maxWidth: 300,
    },
    icon: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: spacing.sm,
      color: theme.colors.error,
    },
    message: {
      fontSize: 14,
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    retryButton: {
      minWidth: 120,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Card style={styles.card}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error}
          style={styles.icon}
        />
        <Text style={styles.title}>Oops!</Text>
        <Text style={styles.message}>{message}</Text>
        {showRetry && onRetry && (
          <Button 
            mode="contained" 
            onPress={onRetry}
            style={styles.retryButton}
            icon="refresh"
          >
            Try Again
          </Button>
        )}
      </Card>
    </SafeAreaView>
  );
}