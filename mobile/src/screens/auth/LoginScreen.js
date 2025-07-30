import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  useTheme,
  HelperText,
  IconButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

import { useAuth } from '../../contexts/AuthContext';
import { spacing } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const { login, isLoading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    let hasError = false;
    
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) return;

    try {
      await login(email.toLowerCase().trim(), password);
    } catch (error) {
      // Error is handled by the auth context
      console.log('Login error:', error.message);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    backButton: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    logo: {
      fontSize: 60,
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    card: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    input: {
      marginBottom: spacing.md,
    },
    passwordContainer: {
      position: 'relative',
    },
    showPasswordButton: {
      position: 'absolute',
      right: 0,
      top: 8,
    },
    loginButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.xs,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    footer: {
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    footerText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    registerButton: {
      paddingVertical: spacing.xs,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <Animatable.View animation="fadeInDown" style={styles.header}>
              <IconButton
                icon="arrow-left"
                size={24}
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              />
              <Text style={styles.logo}>💊</Text>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to access your medicine reminders
              </Text>
            </Animatable.View>

            {/* Login Form */}
            <Animatable.View animation="fadeInUp" delay={300}>
              <Card style={styles.card}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!emailError}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!emailError}>
                  {emailError}
                </HelperText>

                <View style={styles.passwordContainer}>
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    error={!!passwordError}
                    style={styles.input}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                </View>
                <HelperText type="error" visible={!!passwordError}>
                  {passwordError}
                </HelperText>

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.loginButton}
                  contentStyle={{ paddingVertical: 8 }}
                >
                  Sign In
                </Button>
              </Card>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don't have an account?
                </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Register')}
                  style={styles.registerButton}
                >
                  Create Account
                </Button>
              </View>
            </Animatable.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}