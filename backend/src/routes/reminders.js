const express = require('express');
const moment = require('moment');
const Reminder = require('../models/Reminder');
const ReminderLog = require('../models/ReminderLog');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const logger = require('../config/logger');

const router = express.Router();

// Get today's reminders for a patient
router.get('/today/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Authorization check
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');

    const todayReminders = await Reminder.find({
      patientId,
      scheduledTime: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      }
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

    // Group reminders by status
    const groupedReminders = {
      upcoming: [],
      due: [],
      taken: [],
      missed: [],
      snoozed: []
    };

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000));

    todayReminders.forEach(reminder => {
      if (reminder.status === 'taken') {
        groupedReminders.taken.push(reminder);
      } else if (reminder.status === 'missed') {
        groupedReminders.missed.push(reminder);
      } else if (reminder.snoozedUntil && reminder.snoozedUntil > now) {
        groupedReminders.snoozed.push(reminder);
      } else if (reminder.scheduledTime <= fiveMinutesFromNow) {
        groupedReminders.due.push(reminder);
      } else {
        groupedReminders.upcoming.push(reminder);
      }
    });

    res.json({
      date: today.format('YYYY-MM-DD'),
      reminders: groupedReminders,
      summary: {
        total: todayReminders.length,
        taken: groupedReminders.taken.length,
        missed: groupedReminders.missed.length,
        pending: groupedReminders.upcoming.length + groupedReminders.due.length + groupedReminders.snoozed.length
      }
    });
  } catch (error) {
    logger.error('Today reminders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s reminders' });
  }
});

// Get reminders for a date range
router.get('/range/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate, status } = req.query;

    // Authorization check
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = { patientId };

    if (startDate && endDate) {
      query.scheduledTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) {
      query.status = status;
    }

    const reminders = await Reminder.find(query)
      .populate({
        path: 'prescriptionId',
        select: 'prescriptionNumber diagnosis doctorId',
        populate: {
          path: 'doctorId',
          select: 'name'
        }
      })
      .sort({ scheduledTime: 1 });

    res.json({ reminders });
  } catch (error) {
    logger.error('Reminders range fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Mark reminder as taken
router.post('/:id/mark-taken', authenticate, validate(schemas.markReminder), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, location } = req.body;

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // Authorization check
    if (req.user._id.toString() !== reminder.patientId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Can't mark as taken if already taken or missed
    if (reminder.status === 'taken') {
      return res.status(400).json({ error: 'Reminder already marked as taken' });
    }

    const now = new Date();
    reminder.status = 'taken';
    reminder.takenAt = now;
    await reminder.save();

    // Create reminder log
    const reminderLog = new ReminderLog({
      patientId: reminder.patientId,
      reminderId: reminder._id,
      prescriptionId: reminder.prescriptionId,
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      scheduledTime: reminder.scheduledTime,
      action: 'taken',
      actionTime: now,
      notes,
      location
    });

    await reminderLog.save();

    logger.info(`Reminder marked as taken: ${id} by patient ${req.user._id}`);

    res.json({
      message: 'Reminder marked as taken successfully',
      reminder
    });
  } catch (error) {
    logger.error('Mark reminder taken error:', error);
    res.status(500).json({ error: 'Failed to mark reminder as taken' });
  }
});

// Mark reminder as missed
router.post('/:id/mark-missed', authenticate, validate(schemas.markReminder), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // Authorization check
    if (req.user._id.toString() !== reminder.patientId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date();
    reminder.status = 'missed';
    reminder.missedAt = now;
    await reminder.save();

    // Create reminder log
    const reminderLog = new ReminderLog({
      patientId: reminder.patientId,
      reminderId: reminder._id,
      prescriptionId: reminder.prescriptionId,
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      scheduledTime: reminder.scheduledTime,
      action: 'missed',
      actionTime: now,
      notes
    });

    await reminderLog.save();

    logger.info(`Reminder marked as missed: ${id} by patient ${req.user._id}`);

    res.json({
      message: 'Reminder marked as missed successfully',
      reminder
    });
  } catch (error) {
    logger.error('Mark reminder missed error:', error);
    res.status(500).json({ error: 'Failed to mark reminder as missed' });
  }
});

// Snooze reminder
router.post('/:id/snooze', authenticate, validate(schemas.snoozeReminder), async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes = 15 } = req.body;

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // Authorization check
    if (req.user._id.toString() !== reminder.patientId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Can't snooze if already taken or missed
    if (reminder.status === 'taken' || reminder.status === 'missed') {
      return res.status(400).json({ error: 'Cannot snooze completed reminder' });
    }

    // Check snooze limit
    if (reminder.snoozeCount >= 3) {
      return res.status(400).json({ error: 'Maximum snooze limit reached' });
    }

    await reminder.snooze();

    // Create reminder log
    const reminderLog = new ReminderLog({
      patientId: reminder.patientId,
      reminderId: reminder._id,
      prescriptionId: reminder.prescriptionId,
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      scheduledTime: reminder.scheduledTime,
      action: 'snoozed',
      actionTime: new Date(),
      notes: `Snoozed for ${minutes} minutes`
    });

    await reminderLog.save();

    logger.info(`Reminder snoozed: ${id} by patient ${req.user._id}`);

    res.json({
      message: `Reminder snoozed for ${minutes} minutes`,
      reminder
    });
  } catch (error) {
    logger.error('Snooze reminder error:', error);
    res.status(500).json({ error: error.message || 'Failed to snooze reminder' });
  }
});

// Get reminder history for a patient
router.get('/history/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20, action, startDate, endDate } = req.query;

    // Authorization check
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = { patientId };

    if (action) {
      query.action = action;
    }

    if (startDate && endDate) {
      query.actionTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { actionTime: -1 },
      populate: {
        path: 'prescriptionId',
        select: 'prescriptionNumber diagnosis'
      }
    };

    const history = await ReminderLog.paginate(query, options);

    res.json({
      history: history.docs,
      pagination: {
        page: history.page,
        pages: history.totalPages,
        total: history.totalDocs,
        limit: history.limit,
      }
    });
  } catch (error) {
    logger.error('Reminder history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reminder history' });
  }
});

// Get adherence statistics
router.get('/adherence/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { period = 'week' } = req.query; // week, month, quarter

    // Authorization check
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let startDate;
    switch (period) {
      case 'month':
        startDate = moment().subtract(30, 'days').startOf('day').toDate();
        break;
      case 'quarter':
        startDate = moment().subtract(90, 'days').startOf('day').toDate();
        break;
      default: // week
        startDate = moment().subtract(7, 'days').startOf('day').toDate();
    }

    const endDate = moment().endOf('day').toDate();

    // Get overall stats
    const stats = await ReminderLog.getAdherenceStats(patientId, startDate, endDate);
    
    // Get daily breakdown
    const dailyStats = await ReminderLog.getWeeklyAdherence(patientId);

    let adherenceRate = 0;
    if (stats.length > 0) {
      const totalActions = stats[0].total;
      const takenActions = stats[0].actions.find(a => a.action === 'taken')?.count || 0;
      adherenceRate = totalActions > 0 ? Math.round((takenActions / totalActions) * 100) : 0;
    }

    res.json({
      period,
      adherenceRate,
      overallStats: stats[0] || { total: 0, actions: [] },
      dailyBreakdown: dailyStats
    });
  } catch (error) {
    logger.error('Adherence stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch adherence statistics' });
  }
});

module.exports = router;