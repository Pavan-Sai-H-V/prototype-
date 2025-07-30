const moment = require('moment');
const Prescription = require('../models/Prescription');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendPushNotification, sendBulkNotifications } = require('../config/firebase');
const logger = require('../config/logger');

class ReminderService {
  /**
   * Generate reminders for a new prescription
   */
  async generateRemindersForPrescription(prescription) {
    try {
      if (prescription.remindersGenerated) {
        logger.warn(`Reminders already generated for prescription: ${prescription.prescriptionNumber}`);
        return;
      }

      const reminders = [];
      const startDate = moment(prescription.startDate);
      const endDate = moment(prescription.endDate);

      // For each medicine in the prescription
      for (const medicine of prescription.medicines) {
        const medicineDuration = medicine.duration.days;
        const medicineEndDate = moment(startDate).add(medicineDuration, 'days');
        const actualEndDate = medicineEndDate.isBefore(endDate) ? medicineEndDate : endDate;

        // For each timing in the medicine
        for (const timing of medicine.timings) {
          const [hours, minutes] = timing.time.split(':').map(Number);
          
          // Generate reminders for each day
          let currentDate = moment(startDate);
          while (currentDate.isSameOrBefore(actualEndDate, 'day')) {
            const scheduledTime = moment(currentDate)
              .hours(hours)
              .minutes(minutes)
              .seconds(0)
              .milliseconds(0);

            // Skip if scheduled time is in the past
            if (scheduledTime.isAfter(moment())) {
              // Calculate reminder time (5 minutes before scheduled time)
              const reminderTime = moment(scheduledTime).subtract(5, 'minutes');

              const reminder = {
                patientId: prescription.patientId,
                prescriptionId: prescription._id,
                medicineId: medicine._id,
                medicineName: medicine.name,
                dosage: medicine.dosage,
                scheduledTime: scheduledTime.toDate(),
                reminderTime: reminderTime.toDate(),
                instructions: {
                  beforeAfterMeal: timing.beforeAfterMeal,
                  additionalNotes: medicine.instructions
                }
              };

              reminders.push(reminder);
            }

            currentDate.add(1, 'day');
          }
        }
      }

      // Bulk insert reminders
      if (reminders.length > 0) {
        await Reminder.insertMany(reminders);
        logger.info(`Generated ${reminders.length} reminders for prescription: ${prescription.prescriptionNumber}`);
      }

      // Mark prescription as having reminders generated
      prescription.remindersGenerated = true;
      await prescription.save();

    } catch (error) {
      logger.error('Error generating reminders for prescription:', error);
      throw error;
    }
  }

  /**
   * Update reminders when prescription status changes
   */
  async updateRemindersForPrescription(prescriptionId, status) {
    try {
      if (status === 'cancelled') {
        // Cancel all pending reminders
        await Reminder.updateMany(
          { 
            prescriptionId, 
            status: { $in: ['pending', 'sent'] },
            scheduledTime: { $gt: new Date() }
          },
          { status: 'skipped' }
        );
        logger.info(`Cancelled reminders for prescription: ${prescriptionId}`);
      } else if (status === 'paused') {
        // Mark future reminders as paused (we can create a 'paused' status if needed)
        // For now, we'll skip them
        await Reminder.updateMany(
          { 
            prescriptionId, 
            status: { $in: ['pending', 'sent'] },
            scheduledTime: { $gt: new Date() }
          },
          { status: 'skipped' }
        );
        logger.info(`Paused reminders for prescription: ${prescriptionId}`);
      }
    } catch (error) {
      logger.error('Error updating reminders for prescription:', error);
      throw error;
    }
  }

  /**
   * Check for due reminders and send notifications
   */
  async checkAndSendDueReminders() {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000));

      // Find reminders that are due (reminderTime is now or in the past)
      // and haven't been sent yet
      const dueReminders = await Reminder.find({
        reminderTime: { $lte: now },
        notificationSent: false,
        status: 'pending',
        // Don't send if snoozed and snooze time hasn't passed
        $or: [
          { snoozedUntil: { $exists: false } },
          { snoozedUntil: null },
          { snoozedUntil: { $lte: now } }
        ]
      }).populate('patientId', 'name fcmToken');

      if (dueReminders.length === 0) {
        return { sent: 0, failed: 0 };
      }

      const notifications = [];
      const reminderUpdates = [];

      for (const reminder of dueReminders) {
        if (!reminder.patientId.fcmToken) {
          logger.warn(`No FCM token for patient: ${reminder.patientId._id}`);
          continue;
        }

        const mealInstruction = this.getMealInstructionText(reminder.instructions.beforeAfterMeal);
        const title = '💊 Medicine Reminder';
        const body = `Time to take ${reminder.medicineName} (${reminder.dosage})${mealInstruction}`;

        notifications.push({
          fcmToken: reminder.patientId.fcmToken,
          title,
          body,
          data: {
            type: 'medicine_reminder',
            reminderId: reminder._id.toString(),
            prescriptionId: reminder.prescriptionId.toString(),
            medicineName: reminder.medicineName,
            dosage: reminder.dosage,
            scheduledTime: reminder.scheduledTime.toISOString(),
          }
        });

        reminderUpdates.push({
          updateOne: {
            filter: { _id: reminder._id },
            update: {
              $set: {
                notificationSent: true,
                notificationSentAt: now,
                status: 'sent'
              }
            }
          }
        });
      }

      // Send notifications in bulk
      let sentCount = 0;
      let failedCount = 0;

      if (notifications.length > 0) {
        try {
          const response = await sendBulkNotifications(notifications);
          sentCount = response.successCount;
          failedCount = response.failureCount;

          // Update reminders that were successfully sent
          if (sentCount > 0) {
            await Reminder.bulkWrite(reminderUpdates);
          }

          logger.info(`Sent ${sentCount} reminder notifications, ${failedCount} failed`);
        } catch (error) {
          logger.error('Error sending bulk notifications:', error);
          failedCount = notifications.length;
        }
      }

      // Auto-mark reminders as missed if they're 2 hours past scheduled time
      await this.autoMarkMissedReminders();

      return { sent: sentCount, failed: failedCount };
    } catch (error) {
      logger.error('Error checking and sending due reminders:', error);
      throw error;
    }
  }

  /**
   * Auto-mark reminders as missed if they're too late
   */
  async autoMarkMissedReminders() {
    try {
      const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));

      const result = await Reminder.updateMany(
        {
          status: 'sent',
          scheduledTime: { $lt: twoHoursAgo }
        },
        {
          $set: {
            status: 'missed',
            missedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        logger.info(`Auto-marked ${result.modifiedCount} reminders as missed`);
      }

      return result.modifiedCount;
    } catch (error) {
      logger.error('Error auto-marking missed reminders:', error);
      throw error;
    }
  }

  /**
   * Get today's reminders summary for a patient
   */
  async getTodaysRemindersSummary(patientId) {
    try {
      const today = moment().startOf('day');
      const tomorrow = moment().add(1, 'day').startOf('day');

      const reminders = await Reminder.find({
        patientId,
        scheduledTime: {
          $gte: today.toDate(),
          $lt: tomorrow.toDate()
        }
      });

      const summary = {
        total: reminders.length,
        taken: 0,
        missed: 0,
        pending: 0,
        snoozed: 0
      };

      const now = new Date();
      reminders.forEach(reminder => {
        if (reminder.status === 'taken') {
          summary.taken++;
        } else if (reminder.status === 'missed') {
          summary.missed++;
        } else if (reminder.snoozedUntil && reminder.snoozedUntil > now) {
          summary.snoozed++;
        } else {
          summary.pending++;
        }
      });

      return summary;
    } catch (error) {
      logger.error('Error getting today\'s reminders summary:', error);
      throw error;
    }
  }

  /**
   * Send a custom notification to a patient
   */
  async sendCustomNotification(patientId, title, body, data = {}) {
    try {
      const patient = await User.findById(patientId).select('name fcmToken');
      
      if (!patient || !patient.fcmToken) {
        throw new Error('Patient not found or no FCM token available');
      }

      const response = await sendPushNotification(patient.fcmToken, title, body, data);
      logger.info(`Custom notification sent to patient: ${patientId}`);
      
      return response;
    } catch (error) {
      logger.error('Error sending custom notification:', error);
      throw error;
    }
  }

  /**
   * Get meal instruction text
   */
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

  /**
   * Get upcoming reminders for a patient (next 24 hours)
   */
  async getUpcomingReminders(patientId, hours = 24) {
    try {
      const now = new Date();
      const future = new Date(now.getTime() + (hours * 60 * 60 * 1000));

      const reminders = await Reminder.find({
        patientId,
        scheduledTime: {
          $gte: now,
          $lte: future
        },
        status: { $in: ['pending', 'sent'] }
      })
      .populate({
        path: 'prescriptionId',
        select: 'prescriptionNumber diagnosis doctorId',
        populate: {
          path: 'doctorId',
          select: 'name'
        }
      })
      .sort({ scheduledTime: 1 });

      return reminders;
    } catch (error) {
      logger.error('Error getting upcoming reminders:', error);
      throw error;
    }
  }
}

module.exports = new ReminderService();