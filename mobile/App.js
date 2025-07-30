import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import { theme } from './src/utils/theme';
import { initializeNotifications } from './src/services/notificationService';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function AppContent() {
  const { user, isLoading, checkAuthState } = useAuth();

  useEffect(() => {
    checkAuthState();
  }, []);

  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
              <StatusBar style="auto" />
            </NotificationProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}