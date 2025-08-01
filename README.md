# EHR Medicine Reminder System

A comprehensive Electronic Health Record (EHR) system with medicine reminders built using React Native, Node.js/Express, and MongoDB.

## Features

### Core Functionality
- =� **Medicine Reminders**: Automated notifications for medicine times
- =� **Mobile App**: React Native app for patients
- <� **Doctor Portal**: Prescription management for healthcare providers
- = **Push Notifications**: Firebase-powered real-time notifications
- =� **Adherence Tracking**: Monitor patient compliance with medication schedules
- � **Background Jobs**: Automatic reminder checking and notification sending

### Key Components
- **Backend API**: Node.js/Express server with MongoDB
- **Mobile App**: React Native with Expo
- **Push Notifications**: Firebase Cloud Messaging
- **Authentication**: JWT-based user authentication
- **Real-time Updates**: Automatic data synchronization

## Project Structure

```
prototype/
   backend/                     # Node.js/Express API Server
      src/
         models/             # MongoDB schemas
         routes/             # API endpoints
         services/           # Business logic
         jobs/               # Background tasks
         middleware/         # Auth & validation
         config/             # Database & Firebase config
      package.json
      server.js
   mobile/                     # React Native Mobile App
      src/
         components/         # Reusable UI components
         screens/            # App screens
         services/           # API calls & notifications
         contexts/           # State management
         navigation/         # Navigation setup
         utils/              # Helper functions
      package.json
      App.js
   README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project with Cloud Messaging enabled

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Start the server**:
   ```bash
   npm run dev
   ```

The API server will be running at `http://localhost:3000`

### Mobile App Setup

1. **Navigate to mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   - For iOS: `npm run ios`
   - For Android: `npm run android`
   - Or scan the QR code with Expo Go app

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Cloud Messaging
3. Generate a service account key
4. Add the credentials to your backend `.env` file
5. Configure the mobile app with your Firebase project

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/fcm-token` - Update FCM token

### Prescriptions
- `POST /api/prescriptions` - Create prescription (doctors only)
- `GET /api/prescriptions/patient/:patientId` - Get patient prescriptions
- `GET /api/prescriptions/:id` - Get single prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `GET /api/prescriptions/patient/:patientId/active` - Get active prescriptions

### Reminders
- `GET /api/reminders/today/:patientId` - Get today's reminders
- `GET /api/reminders/range/:patientId` - Get reminders in date range
- `POST /api/reminders/:id/mark-taken` - Mark reminder as taken
- `POST /api/reminders/:id/mark-missed` - Mark reminder as missed
- `POST /api/reminders/:id/snooze` - Snooze reminder
- `GET /api/reminders/history/:patientId` - Get reminder history
- `GET /api/reminders/adherence/:patientId` - Get adherence statistics

## Database Schema

### Users
- Patient and Doctor profiles
- Authentication credentials
- FCM tokens for notifications
- Profile information

### Prescriptions
- Medicine details and dosages
- Timing schedules
- Duration and instructions
- Doctor-patient relationships

### Reminders
- Auto-generated from prescriptions
- Scheduled notification times
- Status tracking (pending, sent, taken, missed)
- Snooze functionality

### Reminder Logs
- Historical record of all reminder actions
- Adherence tracking data
- Location and device information

## Background Jobs

The system includes a background job that:
- Runs every minute to check for due reminders
- Sends push notifications to patients
- Auto-marks missed reminders after 2 hours
- Handles notification delivery tracking

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### Mobile App Testing
The mobile app can be tested using:
- Expo Go app on physical devices
- iOS Simulator
- Android Emulator

### Manual Testing Workflow
1. Register as a doctor and patient
2. Create a prescription with medicine schedules
3. Verify reminders are generated
4. Test notification functionality
5. Mark medicines as taken/missed
6. Check adherence statistics

## Deployment

### Backend Deployment
- Deploy to services like Heroku, AWS, or DigitalOcean
- Configure production MongoDB instance
- Set up production environment variables
- Configure Firebase for production

### Mobile App Deployment
- Build production app using `expo build`
- Submit to App Store and Google Play Store
- Configure production API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in this repository.