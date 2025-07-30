import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { spacing } from '../../utils/theme';

export default function WelcomeScreen({ navigation }) {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    content: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    logo: {
      fontSize: 80,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.onPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onPrimary,
      textAlign: 'center',
      marginBottom: spacing.xl,
      opacity: 0.9,
      lineHeight: 24,
    },
    buttonContainer: {
      width: '100%',
      marginTop: spacing.xl,
    },
    loginButton: {
      marginBottom: spacing.md,
      paddingVertical: spacing.xs,
    },
    registerButton: {
      paddingVertical: spacing.xs,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderColor: theme.colors.onPrimary,
      borderWidth: 1,
    },
    registerButtonText: {
      color: theme.colors.onPrimary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animatable.Text 
            animation="bounceIn" 
            duration={1500}
            style={styles.logo}
          >
            💊
          </Animatable.Text>
          
          <Animatable.View 
            animation="fadeInUp" 
            delay={500}
            duration={1000}
          >
            <Text style={styles.title}>
              EHR Medicine Reminder
            </Text>
            <Text style={styles.subtitle}>
              Never miss your medication again.{'\n'}
              Stay healthy, stay on track.
            </Text>
          </Animatable.View>
        </View>

        <Animatable.View 
          animation="fadeInUp" 
          delay={1000}
          duration={1000}
          style={styles.buttonContainer}
        >
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
            buttonColor={theme.colors.onPrimary}
            textColor={theme.colors.primary}
            contentStyle={{ paddingVertical: 8 }}
          >
            Sign In
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerButton}
            textColor={theme.colors.onPrimary}
            contentStyle={{ paddingVertical: 8 }}
          >
            Create Account
          </Button>
        </Animatable.View>
      </LinearGradient>
    </SafeAreaView>
  );
}