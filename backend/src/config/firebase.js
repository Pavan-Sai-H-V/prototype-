const admin = require('firebase-admin');
const logger = require('./logger');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      logger.info('Firebase Admin SDK initialized successfully');
    }
    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

const getFirebaseApp = () => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const app = getFirebaseApp();
    const messaging = admin.messaging(app);

    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'medicine_reminders',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    logger.info(`Push notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    logger.error('Failed to send push notification:', error);
    throw error;
  }
};

const sendBulkNotifications = async (notifications) => {
  try {
    const app = getFirebaseApp();
    const messaging = admin.messaging(app);

    const messages = notifications.map(({ fcmToken, title, body, data = {} }) => ({
      token: fcmToken,
      notification: { title, body },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'medicine_reminders',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    }));

    const response = await messaging.sendAll(messages);
    logger.info(`Bulk notifications sent: ${response.successCount}/${notifications.length}`);
    return response;
  } catch (error) {
    logger.error('Failed to send bulk notifications:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  sendPushNotification,
  sendBulkNotifications,
};