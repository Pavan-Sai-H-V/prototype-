const express = require('express');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const reminderService = require('../services/reminderService');
const logger = require('../config/logger');

const router = express.Router();

// Create new prescription (doctors only)
router.post('/', authenticate, authorize('doctor'), validate(schemas.createPrescription), async (req, res) => {
  try {
    const { patientId, diagnosis, medicines, startDate, notes, followUpDate } = req.body;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Create prescription
    const prescription = new Prescription({
      patientId,
      doctorId: req.user._id,
      diagnosis,
      medicines,
      startDate: startDate || new Date(),
      notes,
      followUpDate,
    });

    await prescription.save();

    // Generate reminders for this prescription
    await reminderService.generateRemindersForPrescription(prescription);

    // Populate doctor and patient info
    await prescription.populate([
      { path: 'patientId', select: 'name email phoneNumber' },
      { path: 'doctorId', select: 'name email' }
    ]);

    logger.info(`Prescription created: ${prescription.prescriptionNumber} by Dr. ${req.user.name}`);

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription,
    });
  } catch (error) {
    logger.error('Prescription creation error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Get prescriptions for a patient
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Authorization: patients can only see their own, doctors can see any
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build query
    const query = { patientId };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'doctorId', select: 'name email' },
        { path: 'patientId', select: 'name email phoneNumber' }
      ]
    };

    const prescriptions = await Prescription.paginate(query, options);

    res.json({
      prescriptions: prescriptions.docs,
      pagination: {
        page: prescriptions.page,
        pages: prescriptions.totalPages,
        total: prescriptions.totalDocs,
        limit: prescriptions.limit,
      },
    });
  } catch (error) {
    logger.error('Prescription fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get single prescription
router.get('/:id', authenticate, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate([
        { path: 'patientId', select: 'name email phoneNumber' },
        { path: 'doctorId', select: 'name email' }
      ]);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Authorization check
    const isOwner = req.user._id.toString() === prescription.patientId._id.toString();
    const isDoctor = req.user._id.toString() === prescription.doctorId._id.toString();
    const canAccess = req.user.role === 'doctor' || isOwner || isDoctor;

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ prescription });
  } catch (error) {
    logger.error('Prescription fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// Update prescription (doctors only)
router.put('/:id', authenticate, authorize('doctor'), validate(schemas.updatePrescription), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Only the prescribing doctor can update
    if (prescription.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allowedUpdates = ['status', 'notes', 'followUpDate'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patientId', select: 'name email phoneNumber' },
      { path: 'doctorId', select: 'name email' }
    ]);

    // If prescription is cancelled or paused, update related reminders
    if (updates.status === 'cancelled' || updates.status === 'paused') {
      await reminderService.updateRemindersForPrescription(updatedPrescription._id, updates.status);
    }

    logger.info(`Prescription updated: ${updatedPrescription.prescriptionNumber} by Dr. ${req.user.name}`);

    res.json({
      message: 'Prescription updated successfully',
      prescription: updatedPrescription,
    });
  } catch (error) {
    logger.error('Prescription update error:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

// Get prescriptions by doctor
router.get('/doctor/my-prescriptions', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10, patientName } = req.query;

    // Build query
    const query = { doctorId: req.user._id };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [{ path: 'patientId', select: 'name email phoneNumber' }]
    };

    let prescriptions;
    
    if (patientName) {
      // If searching by patient name, we need to use aggregation
      prescriptions = await Prescription.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'patientId',
            foreignField: '_id',
            as: 'patientId'
          }
        },
        { $unwind: '$patientId' },
        {
          $match: {
            'patientId.name': { $regex: patientName, $options: 'i' }
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      ]);
    } else {
      prescriptions = await Prescription.paginate(query, options);
    }

    res.json({
      prescriptions: Array.isArray(prescriptions) ? prescriptions : prescriptions.docs,
      pagination: Array.isArray(prescriptions) ? null : {
        page: prescriptions.page,
        pages: prescriptions.totalPages,
        total: prescriptions.totalDocs,
        limit: prescriptions.limit,
      },
    });
  } catch (error) {
    logger.error('Doctor prescriptions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get active prescriptions for a patient (with current medicines)
router.get('/patient/:patientId/active', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Authorization check
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activePrescriptions = await Prescription.find({
      patientId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    })
    .populate('doctorId', 'name email')
    .sort({ createdAt: -1 });

    // Get all current medicines with their schedules
    const currentMedicines = [];
    activePrescriptions.forEach(prescription => {
      prescription.medicines.forEach(medicine => {
        currentMedicines.push({
          prescriptionId: prescription._id,
          prescriptionNumber: prescription.prescriptionNumber,
          doctorName: prescription.doctorId.name,
          medicine: {
            id: medicine._id,
            name: medicine.name,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            timings: medicine.timings,
            instructions: medicine.instructions,
            duration: medicine.duration,
          }
        });
      });
    });

    res.json({
      activePrescriptions,
      currentMedicines,
    });
  } catch (error) {
    logger.error('Active prescriptions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch active prescriptions' });
  }
});

module.exports = router;