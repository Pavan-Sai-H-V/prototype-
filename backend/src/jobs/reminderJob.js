const cron = require('node-cron');
const reminderService = require('../services/reminderService');
const logger = require('../config/logger');

class ReminderJob {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Start the reminder checking job
   */
  start() {
    if (this.job) {
      logger.warn('Reminder job is already running');
      return;
    }

    // Run every minute
    this.job = cron.schedule('* * * * *', async () => {
      if (this.isRunning) {
        logger.debug('Reminder job is already running, skipping this cycle');
        return;
      }

      try {
        this.isRunning = true;
        logger.debug('Starting reminder check cycle...');
        
        const result = await reminderService.checkAndSendDueReminders();
        
        if (result.sent > 0 || result.failed > 0) {
          logger.info(`Reminder check completed: ${result.sent} sent, ${result.failed} failed`);
        }
      } catch (error) {
        logger.error('Error in reminder job:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    logger.info('Reminder job started - checking every minute');
  }

  /**
   * Stop the reminder checking job
   */
  stop() {
    if (this.job) {
      this.job.destroy();
      this.job = null;
      logger.info('Reminder job stopped');
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      running: !!this.job,
      isProcessing: this.isRunning,
      nextRun: this.job ? this.job.nextDates().toISOString() : null
    };
  }

  /**
   * Run the job manually (for testing)
   */
  async runNow() {
    if (this.isRunning) {
      throw new Error('Job is already running');
    }

    try {
      this.isRunning = true;
      logger.info('Running reminder job manually...');
      
      const result = await reminderService.checkAndSendDueReminders();
      
      logger.info(`Manual reminder job completed: ${result.sent} sent, ${result.failed} failed`);
      return result;
    } catch (error) {
      logger.error('Error in manual reminder job:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
}

// Export singleton instance
module.exports = new ReminderJob();