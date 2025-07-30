import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const initialState = {
  expoPushToken: null,
  notifications: [],
  isEnabled: false,
  permissionStatus: null,
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PUSH_TOKEN':
      return { ...state, expoPushToken: action.payload };
    case 'SET_PERMISSION_STATUS':
      return { ...state, permissionStatus: action.payload };
    case 'SET_ENABLED':
      return { ...state, isEnabled: action.payload };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications].slice(0, 50) // Keep last 50
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        ),
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, updateFCMToken } = useAuth();

  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  const initializeNotifications = async () => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      dispatch({ type: 'SET_PERMISSION_STATUS', payload: status });
      dispatch({ type: 'SET_ENABLED', payload: status === 'granted' });

      if (status === 'granted') {
        // Get Expo push token
        const token = await notificationService.registerForPushNotifications();
        if (token) {
          dispatch({ type: 'SET_PUSH_TOKEN', payload: token });
          // Update FCM token on server
          await updateFCMToken(token);
        }

        // Set up notification handlers
        setupNotificationHandlers();
      }
    } catch (error) {
      console.error('Notification initialization failed:', error);
    }
  };

  const setupNotificationHandlers = () => {
    // Handle notifications when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Listen for notifications received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: {
          id: notification.request.identifier,
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
          time: new Date(),
          read: false,
        }
      });
    });

    // Listen for user tapping on notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const notification = response.notification;
      const data = notification.request.content.data;
      
      // Handle different notification types
      if (data.type === 'medicine_reminder') {
        // Navigate to reminder screen or handle reminder action
        handleReminderNotification(data);
      }
      
      // Mark as read
      dispatch({ 
        type: 'MARK_NOTIFICATION_READ', 
        payload: notification.request.identifier 
      });
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  };

  const handleReminderNotification = (data) => {
    // This would be implemented to navigate to the specific reminder
    // or handle the reminder action directly
    console.log('Handling reminder notification:', data);
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      dispatch({ type: 'SET_PERMISSION_STATUS', payload: status });
      dispatch({ type: 'SET_ENABLED', payload: status === 'granted' });
      
      if (status === 'granted') {
        await initializeNotifications();
      }
      
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const scheduleLocalNotification = async (title, body, data = {}, scheduledTime) => {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: scheduledTime ? { date: scheduledTime } : null,
      });
      
      return identifier;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  };

  const cancelNotification = async (identifier) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const markNotificationAsRead = (notificationId) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const getUnreadCount = () => {
    return state.notifications.filter(notif => !notif.read).length;
  };

  const value = {
    ...state,
    requestPermissions,
    scheduleLocalNotification,
    cancelNotification,
    clearAllNotifications,
    markNotificationAsRead,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};