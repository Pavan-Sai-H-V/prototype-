const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  // User schemas
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('patient', 'doctor').default('patient'),
    phoneNumber: Joi.string().pattern(/^[+]?[1-9][\d\s\-\(\)]{7,15}$/),
    dateOfBirth: Joi.date().max('now'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    phoneNumber: Joi.string().pattern(/^[+]?[1-9][\d\s\-\(\)]{7,15}$/),
    dateOfBirth: Joi.date().max('now'),
    fcmToken: Joi.string(),
    profile: Joi.object({
      avatar: Joi.string().uri(),
      gender: Joi.string().valid('male', 'female', 'other'),
      emergencyContact: Joi.object({
        name: Joi.string().min(2).max(50),
        phoneNumber: Joi.string().pattern(/^[+]?[1-9][\d\s\-\(\)]{7,15}$/),
        relationship: Joi.string().min(2).max(30)
      })
    })
  }),

  // Prescription schemas
  createPrescription: Joi.object({
    patientId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    diagnosis: Joi.string().min(5).max(500).required(),
    medicines: Joi.array().min(1).items(
      Joi.object({
        name: Joi.string().min(2).max(100).required(),
        dosage: Joi.string().min(1).max(50).required(),
        frequency: Joi.string().valid('once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed').required(),
        timings: Joi.array().min(1).items(
          Joi.object({
            time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
            beforeAfterMeal: Joi.string().valid('before_meal', 'after_meal', 'with_meal', 'empty_stomach', 'anytime').default('anytime')
          })
        ).required(),
        duration: Joi.object({
          days: Joi.number().integer().min(1).max(365).required(),
          instructions: Joi.string().max(200)
        }).required(),
        instructions: Joi.string().max(300),
        sideEffects: Joi.array().items(Joi.string().max(100))
      })
    ).required(),
    startDate: Joi.date().min('now'),
    notes: Joi.string().max(500),
    followUpDate: Joi.date().min('now')
  }),

  updatePrescription: Joi.object({
    status: Joi.string().valid('active', 'completed', 'cancelled', 'paused'),
    notes: Joi.string().max(500),
    followUpDate: Joi.date().min('now')
  }),

  // Reminder schemas
  markReminder: Joi.object({
    action: Joi.string().valid('taken', 'missed', 'skipped').required(),
    notes: Joi.string().max(200),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().length(2).items(Joi.number()).default([0, 0])
    })
  }),

  snoozeReminder: Joi.object({
    minutes: Joi.number().integer().min(5).max(60).default(15)
  })
};

module.exports = {
  validate,
  schemas,
};