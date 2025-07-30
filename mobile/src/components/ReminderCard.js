import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Chip, 
  useTheme,
  IconButton,
  Menu,
  Divider
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Animatable from 'react-native-animatable';

import { reminderService } from '../services/reminderService';
import { spacing } from '../utils/theme';

export default function ReminderCard({ 
  reminder, 
  onPress, 
  onAction, 
  showActions = false, 
  urgent = false 
}) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action, notes = '') => {
    setActionLoading(action);
    try {
      await onAction(reminder._id, action, notes);
    } catch (error) {
      console.error('Error performing reminder action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = () => {
    return reminderService.getReminderStatusColor(reminder.status);
  };

  const getStatusIcon = () => {
    return reminderService.getReminderStatusIcon(reminder.status);
  };

  const getMealInstructionText = () => {
    return reminderService.getMealInstructionText(reminder.instructions?.beforeAfterMeal);
  };

  const formatTime = () => {
    return reminderService.formatReminderTime(reminder.scheduledTime);
  };

  const getTimeUntil = () => {
    return reminderService.calculateTimeUntilReminder(reminder.scheduledTime);
  };

  const styles = StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      elevation: urgent ? 8 : 2,
      borderLeftWidth: urgent ? 4 : 0,
      borderLeftColor: urgent ? theme.colors.error : 'transparent',
    },
    urgentCard: {
      backgroundColor: urgent ? `${theme.colors.error}10` : theme.colors.surface,
    },
    cardContent: {
      padding: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    medicineInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    medicineName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    dosage: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    timeText: {
      fontSize: 16,
      fontWeight: '500',
      color: urgent ? theme.colors.error : theme.colors.primary,
      marginLeft: spacing.xs,
    },
    mealInstruction: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    statusChip: {
      alignSelf: 'flex-start',
    },
    prescriptionInfo: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    doctorName: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    prescriptionNumber: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: spacing.xs,
    },
    takenButton: {
      backgroundColor: theme.colors.success,
    },
    snoozeButton: {
      backgroundColor: theme.colors.warning,
    },
    missedButton: {
      backgroundColor: theme.colors.error,
    },
    timeUntilText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    menuButton: {
      margin: 0,
    },
  });

  const timeUntil = getTimeUntil();
  const mealInstruction = getMealInstructionText();

  const CardComponent = urgent ? Animatable.View : View;
  const cardProps = urgent ? { 
    animation: 'pulse', 
    iterationCount: 'infinite', 
    duration: 2000 
  } : {};

  return (
    <CardComponent {...cardProps}>
      <Card 
        style={[styles.card, urgent && styles.urgentCard]} 
        onPress={() => onPress(reminder)}
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.medicineInfo}>
              <Text style={styles.medicineName}>{reminder.medicineName}</Text>
              <Text style={styles.dosage}>{reminder.dosage}</Text>
              
              {/* Time Information */}
              <View style={styles.timeInfo}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={16} 
                  color={urgent ? theme.colors.error : theme.colors.primary}
                />
                <Text style={styles.timeText}>{formatTime()}</Text>
              </View>
              
              {!timeUntil.isPast && (
                <Text style={styles.timeUntilText}>{timeUntil.text}</Text>
              )}
              
              {mealInstruction && (
                <Text style={styles.mealInstruction}>{mealInstruction}</Text>
              )}
            </View>

            {/* Status and Menu */}
            <View style={{ alignItems: 'flex-end' }}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: `${getStatusColor()}20` }]}
                textStyle={{ color: getStatusColor(), fontSize: 12 }}
                icon={getStatusIcon()}
                compact
              >
                {reminder.status.replace('_', ' ')}
              </Chip>
              
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item onPress={() => onPress(reminder)} title="View Details" />
                {reminder.status === 'pending' && (
                  <>
                    <Menu.Item 
                      onPress={() => handleAction('snooze')} 
                      title="Snooze 15 min" 
                    />
                    <Divider />
                  </>
                )}
                <Menu.Item onPress={() => setMenuVisible(false)} title="Close" />
              </Menu>
            </View>
          </View>

          {/* Prescription Info */}
          {reminder.prescriptionId && (
            <View style={styles.prescriptionInfo}>
              <Text style={styles.doctorName}>
                Dr. {reminder.prescriptionId.doctorId?.name}
              </Text>
              <Text style={styles.prescriptionNumber}>
                Rx: {reminder.prescriptionId.prescriptionNumber}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {showActions && reminder.status !== 'taken' && reminder.status !== 'missed' && (
            <View style={styles.actions}>
              <Button
                mode="contained"
                style={[styles.actionButton, styles.takenButton]}
                onPress={() => handleAction('taken')}
                loading={actionLoading === 'taken'}
                disabled={actionLoading !== null}
                icon="check"
                compact
              >
                Take
              </Button>
              
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={() => handleAction('snooze')}
                loading={actionLoading === 'snooze'}
                disabled={actionLoading !== null || reminder.snoozeCount >= 3}
                icon="clock-plus-outline"
                compact
              >
                Snooze
              </Button>
              
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={() => handleAction('missed')}
                loading={actionLoading === 'missed'}
                disabled={actionLoading !== null}
                icon="close"
                compact
                textColor={theme.colors.error}
              >
                Miss
              </Button>
            </View>
          )}
        </View>
      </Card>
    </CardComponent>
  );
}