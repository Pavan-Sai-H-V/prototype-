import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

export default function LoadingScreen() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      alignItems: 'center',
    },
    logo: {
      fontSize: 48,
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 32,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animatable.Text 
          animation="pulse" 
          iterationCount="infinite" 
          style={styles.logo}
        >
          💊
        </Animatable.Text>
        <Text style={styles.title}>EHR Medicine Reminder</Text>
        <Text style={styles.subtitle}>Loading your health data...</Text>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          animating={true}
        />
      </View>
    </SafeAreaView>
  );
}