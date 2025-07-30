const express = require('express');
const cors = require('cors');

// Simple test server without database dependencies
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock data for testing
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'patient@test.com',
    role: 'patient'
  },
  {
    id: '2',
    name: 'Dr. Smith',
    email: 'doctor@test.com',
    role: 'doctor'
  }
];

const mockReminders = [
  {
    _id: '1',
    patientId: '1',
    medicineName: 'Aspirin',
    dosage: '100mg',
    scheduledTime: new Date(),
    status: 'pending',
    instructions: { beforeAfterMeal: 'after_meal' },
    prescriptionId: {
      prescriptionNumber: 'RX001',
      doctorId: { name: 'Dr. Smith' }
    }
  },
  {
    _id: '2',
    patientId: '1',
    medicineName: 'Vitamin D',
    dosage: '1000 IU',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    status: 'pending',
    instructions: { beforeAfterMeal: 'with_meal' },
    prescriptionId: {
      prescriptionNumber: 'RX002',
      doctorId: { name: 'Dr. Smith' }
    }
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'EHR Reminder API (Test Mode)',
    message: 'Test server running without database'
  });
});

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email);
  if (user && password === 'test123') {
    res.json({
      message: 'Login successful',
      token: 'mock-jwt-token',
      user
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role } = req.body;
  
  const newUser = {
    id: String(mockUsers.length + 1),
    name,
    email,
    role: role || 'patient'
  };
  
  mockUsers.push(newUser);
  
  res.status(201).json({
    message: 'User registered successfully',
    token: 'mock-jwt-token',
    user: newUser
  });
});

// Mock reminders endpoint
app.get('/api/reminders/today/:patientId', (req, res) => {
  const { patientId } = req.params;
  
  const userReminders = mockReminders.filter(r => r.patientId === patientId);
  
  res.json({
    date: new Date().toISOString().split('T')[0],
    reminders: {
      due: userReminders.filter(r => r.status === 'pending' && new Date(r.scheduledTime) <= new Date()),
      upcoming: userReminders.filter(r => r.status === 'pending' && new Date(r.scheduledTime) > new Date()),
      taken: userReminders.filter(r => r.status === 'taken'),
      missed: userReminders.filter(r => r.status === 'missed'),
      snoozed: []
    },
    summary: {
      total: userReminders.length,
      taken: userReminders.filter(r => r.status === 'taken').length,
      missed: userReminders.filter(r => r.status === 'missed').length,
      pending: userReminders.filter(r => r.status === 'pending').length
    }
  });
});

// Mock reminder actions
app.post('/api/reminders/:id/mark-taken', (req, res) => {
  const { id } = req.params;
  const reminder = mockReminders.find(r => r._id === id);
  
  if (reminder) {
    reminder.status = 'taken';
    reminder.takenAt = new Date();
    res.json({ message: 'Reminder marked as taken', reminder });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

app.post('/api/reminders/:id/mark-missed', (req, res) => {
  const { id } = req.params;
  const reminder = mockReminders.find(r => r._id === id);
  
  if (reminder) {
    reminder.status = 'missed';
    reminder.missedAt = new Date();
    res.json({ message: 'Reminder marked as missed', reminder });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

app.post('/api/reminders/:id/snooze', (req, res) => {
  const { id } = req.params;
  const reminder = mockReminders.find(r => r._id === id);
  
  if (reminder) {
    reminder.snoozedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    res.json({ message: 'Reminder snoozed for 15 minutes', reminder });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Test EHR Reminder API Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Server health check`);
  console.log(`   POST /api/auth/login - Login (email: patient@test.com, password: test123)`);
  console.log(`   POST /api/auth/register - Register new user`);
  console.log(`   GET  /api/reminders/today/:patientId - Get today's reminders`);
  console.log(`   POST /api/reminders/:id/mark-taken - Mark reminder as taken`);
  console.log(`   POST /api/reminders/:id/mark-missed - Mark reminder as missed`);
  console.log(`   POST /api/reminders/:id/snooze - Snooze reminder`);
  console.log(`\n📱 Test credentials:`);
  console.log(`   Patient: patient@test.com / test123`);
  console.log(`   Doctor:  doctor@test.com / test123`);
});