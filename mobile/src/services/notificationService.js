import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.expoPushToken = null;
  }

  async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId,
      });

      this.expoPushToken = token.data;
      console.log('Expo push token:', token.data);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medicine_reminders', {
          name: 'Medicine Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async scheduleMedicineReminder(reminder) {
    try {
      const { medicineName, dosage, scheduledTime, instructions } = reminder;
      
      const mealInstruction = this.getMealInstructionText(instructions?.beforeAfterMeal);
      const title = '💊 Medicine Reminder';
      const body = `Time to take ${medicineName} (${dosage})${mealInstruction}`;

      const scheduledDate = new Date(scheduledTime);
      const now = new Date();

      // Don't schedule notifications for past times
      if (scheduledDate <= now) {
        console.log('Skipping past reminder:', scheduledDate);
        return null;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'medicine_reminder',
            reminderId: reminder._id,
            medicineName,
            dosage,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: {
          date: scheduledDate,
        },
      });

      console.log('Scheduled notification:', identifier, 'for', scheduledDate);
      return identifier;
    } catch (error) {
      console.error('Error scheduling medicine reminder:', error);
      return null;
    }
  }

  async scheduleMultipleReminders(reminders) {
    const identifiers = [];
    
    for (const reminder of reminders) {
      const identifier = await this.scheduleMedicineReminder(reminder);
      if (identifier) {
        identifiers.push({ reminderId: reminder._id, notificationId: identifier });
      }
    }
    
    return identifiers;
  }

  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('Cancelled notification:', identifier);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async sendTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from EHR Medicine Reminder',
          data: { test: true },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  getMealInstructionText(beforeAfterMeal) {
    switch (beforeAfterMeal) {
      case 'before_meal':
        return ' (before meal)';
      case 'after_meal':
        return ' (after meal)';
      case 'with_meal':
        return ' (with meal)';
      case 'empty_stomach':
        return ' (on empty stomach)';
      default:
        return '';
    }
  }

  // Set up notification categories for interactive notifications
  async setupNotificationCategories() {
    try {
      await Notifications.setNotificationCategoryAsync('MEDICINE_REMINDER', [
        {
          identifier: 'TAKE_MEDICINE',
          buttonTitle: 'Take Medicine',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'SNOOZE',
          buttonTitle: 'Snooze 15min',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'SKIP',
          buttonTitle: 'Skip',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }

  // Handle notification responses
  handleNotificationResponse(response) {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data;

    switch (actionIdentifier) {
      case 'TAKE_MEDICINE':
        // Handle taking medicine
        this.handleTakeMedicine(data.reminderId);
        break;
      case 'SNOOZE':
        // Handle snoozing
        this.handleSnoozeReminder(data.reminderId);
        break;
      case 'SKIP':
        // Handle skipping
        this.handleSkipReminder(data.reminderId);
        break;
      default:
        // Default action (tapping the notification)
        this.handleDefaultAction(data);
        break;
    }
  }

  async handleTakeMedicine(reminderId) {
    // This would call the API to mark the reminder as taken
    console.log('Taking medicine for reminder:', reminderId);
  }

  async handleSnoozeReminder(reminderId) {
    // This would call the API to snooze the reminder
    console.log('Snoozing reminder:', reminderId);
  }

  async handleSkipReminder(reminderId) {
    // This would call the API to mark the reminder as skipped
    console.log('Skipping reminder:', reminderId);
  }

  handleDefaultAction(data) {
    // Navigate to the appropriate screen
    console.log('Opening app for notification:', data);
  }
}

export const notificationService = new NotificationService();

// Export initialization function
export const initializeNotifications = async () => {
  await notificationService.setupNotificationCategories();
  return notificationService.registerForPushNotifications();
};