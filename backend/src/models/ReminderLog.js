const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const reminderLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reminderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reminder',
    required: true
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    required: true
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
  action: {
    type: String,
    enum: ['taken', 'missed', 'skipped', 'snoozed'],
    required: true
  },
  actionTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  delay: {
    type: Number, // Minutes late/early (positive = late, negative = early)
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  deviceInfo: {
    platform: String,
    version: String,
    model: String
  }
}, {
  timestamps: true
});

// Index for geospatial queries
reminderLogSchema.index({ location: '2dsphere' });

// Index for efficient querying
reminderLogSchema.index({ patientId: 1, actionTime: -1 });
reminderLogSchema.index({ prescriptionId: 1, action: 1 });
reminderLogSchema.index({ reminderId: 1 });

// Calculate delay in minutes
reminderLogSchema.pre('save', function(next) {
  if (this.scheduledTime && this.actionTime) {
    const diffMs = this.actionTime.getTime() - this.scheduledTime.getTime();
    this.delay = Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Static method to get adherence statistics
reminderLogSchema.statics.getAdherenceStats = function(patientId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        patientId: mongoose.Types.ObjectId(patientId),
        actionTime: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        actions: {
          $push: {
            action: '$_id',
            count: '$count'
          }
        }
      }
    }
  ]);
};

// Method to get weekly adherence report
reminderLogSchema.statics.getWeeklyAdherence = function(patientId) {
  const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  
  return this.aggregate([
    {
      $match: {
        patientId: mongoose.Types.ObjectId(patientId),
        actionTime: { $gte: weekAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$actionTime'
          }
        },
        taken: {
          $sum: {
            $cond: [{ $eq: ['$action', 'taken'] }, 1, 0]
          }
        },
        missed: {
          $sum: {
            $cond: [{ $eq: ['$action', 'missed'] }, 1, 0]
          }
        },
        total: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

// Add pagination plugin
reminderLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ReminderLog', reminderLogSchema);