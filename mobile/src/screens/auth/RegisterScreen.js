import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  useTheme,
  HelperText,
  IconButton,
  SegmentedButtons
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

import { useAuth } from '../../contexts/AuthContext';
import { spacing } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const theme = useTheme();
  const { register, isLoading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    phoneNumber: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[+]?[1-9][\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        phoneNumber: formData.phoneNumber.trim() || undefined,
      };

      await register(userData);
    } catch (error) {
      console.log('Registration error:', error.message);
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
    roleSelector: {
      marginBottom: spacing.lg,
    },
    roleLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: spacing.sm,
      color: theme.colors.onSurface,
    },
    registerButton: {
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
    loginButton: {
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
          showsVerticalScrollIndicator={false}
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join us to start managing your medicines
              </Text>
            </Animatable.View>

            {/* Registration Form */}
            <Animatable.View animation="fadeInUp" delay={300}>
              <Card style={styles.card}>
                <TextInput
                  label="Full Name"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  mode="outlined"
                  autoCapitalize="words"
                  autoComplete="name"
                  error={!!errors.name}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.name}>
                  {errors.name}
                </HelperText>

                <TextInput
                  label="Email"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!errors.email}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email}
                </HelperText>

                <TextInput
                  label="Phone Number (Optional)"
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  mode="outlined"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  error={!!errors.phoneNumber}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.phoneNumber}>
                  {errors.phoneNumber}
                </HelperText>

                {/* Role Selection */}
                <View style={styles.roleSelector}>
                  <Text style={styles.roleLabel}>I am a:</Text>
                  <SegmentedButtons
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                    buttons={[
                      {
                        value: 'patient',
                        label: 'Patient',
                        icon: 'account',
                      },
                      {
                        value: 'doctor',
                        label: 'Doctor',
                        icon: 'doctor',
                      },
                    ]}
                  />
                </View>

                <TextInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  error={!!errors.password}
                  style={styles.input}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password}
                </HelperText>

                <TextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  mode="outlined"
                  secureTextEntry={!showConfirmPassword}
                  error={!!errors.confirmPassword}
                  style={styles.input}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
                <HelperText type="error" visible={!!errors.confirmPassword}>
                  {errors.confirmPassword}
                </HelperText>

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleRegister}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.registerButton}
                  contentStyle={{ paddingVertical: 8 }}
                >
                  Create Account
                </Button>
              </Card>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Already have an account?
                </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.loginButton}
                >
                  Sign In
                </Button>
              </View>
            </Animatable.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}