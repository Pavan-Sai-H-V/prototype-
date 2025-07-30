const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true, // e.g., "10mg", "2 tablets"
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed'],
    default: 'once_daily'
  },
  timings: [{
    time: {
      type: String, // Format: "HH:mm" (24-hour format)
      required: true
    },
    beforeAfterMeal: {
      type: String,
      enum: ['before_meal', 'after_meal', 'with_meal', 'empty_stomach', 'anytime'],
      default: 'anytime'
    }
  }],
  duration: {
    days: {
      type: Number,
      required: true,
      min: 1
    },
    instructions: {
      type: String,
      trim: true // e.g., "Take for 7 days", "Continue until symptoms improve"
    }
  },
  instructions: {
    type: String,
    trim: true // Additional instructions for the medicine
  },
  sideEffects: [{
    type: String,
    trim: true
  }]
});

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  medicines: [medicineSchema],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'paused'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
  },
  remindersGenerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate prescription number before saving
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionNumber) {
    const count = await mongoose.model('Prescription').countDocuments();
    this.prescriptionNumber = `RX${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate end date based on maximum medicine duration
prescriptionSchema.pre('save', function(next) {
  if (!this.endDate && this.medicines.length > 0) {
    const maxDuration = Math.max(...this.medicines.map(med => med.duration.days));
    this.endDate = new Date(this.startDate.getTime() + (maxDuration * 24 * 60 * 60 * 1000));
  }
  next();
});

// Add pagination plugin
prescriptionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Prescription', prescriptionSchema);