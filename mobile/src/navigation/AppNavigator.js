import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import screens
import TodayScreen from '../screens/TodayScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReminderDetailScreen from '../screens/ReminderDetailScreen';
import AdherenceScreen from '../screens/AdherenceScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Today tab (includes reminder details)
function TodayStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TodayMain" 
        component={TodayScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ReminderDetail" 
        component={ReminderDetailScreen}
        options={({ route }) => ({
          title: route.params?.medicineName || 'Reminder Details',
          headerBackTitleVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Calendar tab
function CalendarStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CalendarMain" 
        component={CalendarScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ReminderDetail" 
        component={ReminderDetailScreen}
        options={({ route }) => ({
          title: route.params?.medicineName || 'Reminder Details',
          headerBackTitleVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Profile tab
function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Adherence" 
        component={AdherenceScreen}
        options={{
          title: 'Adherence Statistics',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Today':
              iconName = focused ? 'pill' : 'pill-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.disabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Today" 
        component={TodayStack}
        options={{
          tabBarLabel: 'Today',
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStack}
        options={{
          tabBarLabel: 'Calendar',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}