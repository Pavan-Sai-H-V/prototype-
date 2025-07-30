import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  FAB, 
  useTheme,
  Surface,
  Badge,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from 'react-query';
import { format } from 'date-fns';

import { useAuth } from '../contexts/AuthContext';
import { reminderService } from '../services/reminderService';
import ReminderCard from '../components/ReminderCard';
import AdherenceSummary from '../components/AdherenceSummary';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { spacing } from '../utils/theme';

export default function TodayScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch today's reminders
  const {
    data: todaysData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['todaysReminders', user?.id],
    () => reminderService.getTodaysReminders(user.id),
    {
      enabled: !!user?.id,
      refetchInterval: 60000, // Refetch every minute
      refetchOnWindowFocus: true,
    }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleReminderPress = (reminder) => {
    navigation.navigate('ReminderDetail', {
      reminderId: reminder._id,
      medicineName: reminder.medicineName,
    });
  };

  const handleReminderAction = async (reminderId, action, notes = '') => {
    try {
      switch (action) {
        case 'taken':
          await reminderService.markReminderAsTaken(reminderId, notes);
          break;
        case 'missed':
          await reminderService.markReminderAsMissed(reminderId, notes);
          break;
        case 'snooze':
          await reminderService.snoozeReminder(reminderId);
          break;
      }
      
      // Refetch data to update UI
      queryClient.invalidateQueries(['todaysReminders']);
    } catch (error) {
      console.error('Error updating reminder:', error);
      // Show error message to user
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
    header: {
      padding: spacing.md,
      backgroundColor: theme.colors.primary,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    greeting: {
      color: theme.colors.onPrimary,
      fontSize: 24,
      fontWeight: 'bold',
    },
    date: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      opacity: 0.9,
      marginTop: 4,
    },
    notificationBadge: {
      backgroundColor: theme.colors.error,
    },
    content: {
      padding: spacing.md,
    },
    summaryCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
    emptyState: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      marginTop: spacing.xl,
    },
    emptyIcon: {
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.secondary,
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Failed to load today's reminders"
        onRetry={refetch}
      />
    );
  }

  const { reminders, summary } = todaysData || { reminders: {}, summary: {} };
  const allReminders = [
    ...reminders.due || [],
    ...reminders.upcoming || [],
    ...reminders.taken || [],
    ...reminders.missed || [],
    ...reminders.snoozed || [],
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </Text>
            <Text style={styles.date}>
              {format(new Date(), 'EEEE, MMMM d')}
            </Text>
          </View>
          <View style={{ position: 'relative' }}>
            <MaterialCommunityIcons 
              name="bell-outline" 
              size={24} 
              color={theme.colors.onPrimary}
            />
            {summary.pending > 0 && (
              <Badge 
                style={styles.notificationBadge}
                size={20}
              >
                {summary.pending}
              </Badge>
            )}
          </View>
        </View>
      </Surface>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {/* Summary Card */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Medicines</Text>
              <Text style={styles.summaryValue}>{summary.total || 0}</Text>
            </View>
            <Divider />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taken</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                {summary.taken || 0}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>
                {summary.pending || 0}
              </Text>
            </View>
            {summary.missed > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Missed</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                  {summary.missed}
                </Text>
              </View>
            )}
          </Card>

          {/* Due Reminders */}
          {reminders.due && reminders.due.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>
                Due Now ({reminders.due.length})
              </Text>
              {reminders.due.map((reminder) => (
                <ReminderCard
                  key={reminder._id}
                  reminder={reminder}
                  onPress={handleReminderPress}
                  onAction={handleReminderAction}
                  showActions={true}
                  urgent={true}
                />
              ))}
            </>
          )}

          {/* Snoozed Reminders */}
          {reminders.snoozed && reminders.snoozed.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.warning }]}>
                Snoozed ({reminders.snoozed.length})
              </Text>
              {reminders.snoozed.map((reminder) => (
                <ReminderCard
                  key={reminder._id}
                  reminder={reminder}
                  onPress={handleReminderPress}
                  onAction={handleReminderAction}
                  showActions={true}
                />
              ))}
            </>
          )}

          {/* Upcoming Reminders */}
          {reminders.upcoming && reminders.upcoming.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Upcoming ({reminders.upcoming.length})
              </Text>
              {reminders.upcoming.map((reminder) => (
                <ReminderCard
                  key={reminder._id}
                  reminder={reminder}
                  onPress={handleReminderPress}
                  onAction={handleReminderAction}
                  showActions={false}
                />
              ))}
            </>
          )}

          {/* Taken Reminders */}
          {reminders.taken && reminders.taken.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.success }]}>
                Completed ({reminders.taken.length})
              </Text>
              {reminders.taken.map((reminder) => (
                <ReminderCard
                  key={reminder._id}
                  reminder={reminder}
                  onPress={handleReminderPress}
                  onAction={handleReminderAction}
                  showActions={false}
                />
              ))}
            </>
          )}

          {/* Missed Reminders */}
          {reminders.missed && reminders.missed.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>
                Missed ({reminders.missed.length})
              </Text>
              {reminders.missed.map((reminder) => (
                <ReminderCard
                  key={reminder._id}
                  reminder={reminder}
                  onPress={handleReminderPress}
                  onAction={handleReminderAction}
                  showActions={false}
                />
              ))}
            </>
          )}

          {/* Empty State */}
          {allReminders.length === 0 && (
            <View>
              <MaterialCommunityIcons 
                name="pill-outline" 
                size={64} 
                color={theme.colors.disabled}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyState}>
                No medicines scheduled for today.{'\n'}
                Enjoy your healthy day! 🌟
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quick Actions FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          // Navigate to quick add or settings
          console.log('Quick action pressed');
        }}
      />
    </SafeAreaView>
  );
}