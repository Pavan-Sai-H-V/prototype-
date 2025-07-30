const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    required: true
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // Reference to medicine within prescription
  },
  medicineName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  reminderTime: {
    type: Date,
    required: true // When to send the notification (scheduledTime - advance minutes)
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'taken', 'missed', 'skipped'],
    default: 'pending'
  },
  takenAt: {
    type: Date
  },
  missedAt: {
    type: Date
  },
  instructions: {
    beforeAfterMeal: {
      type: String,
      enum: ['before_meal', 'after_meal', 'with_meal', 'empty_stomach', 'anytime'],
      default: 'anytime'
    },
    additionalNotes: {
      type: String,
      trim: true
    }
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: {
    type: Date
  },
  snoozeCount: {
    type: Number,
    default: 0,
    max: 3 // Maximum 3 snoozes allowed
  },
  snoozedUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
reminderSchema.index({ patientId: 1, scheduledTime: 1 });
reminderSchema.index({ reminderTime: 1, status: 1 });
reminderSchema.index({ patientId: 1, status: 1, scheduledTime: 1 });

// Mark as missed if not taken within 2 hours of scheduled time
reminderSchema.methods.checkIfMissed = function() {
  const now = new Date();
  const twoHoursAfterScheduled = new Date(this.scheduledTime.getTime() + (2 * 60 * 60 * 1000));
  
  if (now > twoHoursAfterScheduled && this.status === 'sent') {
    this.status = 'missed';
    this.missedAt = now;
    return this.save();
  }
  return Promise.resolve(this);
};

// Snooze reminder for 15 minutes
reminderSchema.methods.snooze = function() {
  if (this.snoozeCount >= 3) {
    throw new Error('Maximum snooze limit reached');
  }
  
  this.snoozeCount += 1;
  this.snoozedUntil = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes
  this.reminderTime = this.snoozedUntil;
  this.notificationSent = false;
  
  return this.save();
};

module.exports = mongoose.model('Reminder', reminderSchema);