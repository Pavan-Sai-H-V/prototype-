import api from './api';

class ReminderService {
  async getTodaysReminders(patientId) {
    try {
      const response = await api.get(`/reminders/today/${patientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getRemindersInRange(patientId, startDate, endDate, status = null) {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      if (status) {
        params.append('status', status);
      }

      const response = await api.get(`/reminders/range/${patientId}?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async markReminderAsTaken(reminderId, notes = '', location = null) {
    try {
      const data = { notes };
      if (location) {
        data.location = location;
      }

      const response = await api.post(`/reminders/${reminderId}/mark-taken`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async markReminderAsMissed(reminderId, notes = '') {
    try {
      const response = await api.post(`/reminders/${reminderId}/mark-missed`, {
        notes,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async snoozeReminder(reminderId, minutes = 15) {
    try {
      const response = await api.post(`/reminders/${reminderId}/snooze`, {
        minutes,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getReminderHistory(patientId, page = 1, limit = 20, action = null, startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (action) params.append('action', action);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await api.get(`/reminders/history/${patientId}?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAdherenceStats(patientId, period = 'week') {
    try {
      const response = await api.get(`/reminders/adherence/${patientId}?period=${period}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Helper methods for local reminder management
  calculateTimeUntilReminder(scheduledTime) {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMs = scheduled.getTime() - now.getTime();
    
    if (diffMs <= 0) return { isPast: true, text: 'Overdue' };
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return { isPast: false, text: `in ${diffDays} day${diffDays > 1 ? 's' : ''}` };
    } else if (diffHours > 0) {
      return { isPast: false, text: `in ${diffHours} hour${diffHours > 1 ? 's' : ''}` };
    } else if (diffMinutes > 0) {
      return { isPast: false, text: `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}` };
    } else {
      return { isPast: false, text: 'now' };
    }
  }

  formatReminderTime(scheduledTime) {
    const date = new Date(scheduledTime);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  }

  formatReminderDate(scheduledTime) {
    const date = new Date(scheduledTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  getMealInstructionText(beforeAfterMeal) {
    switch (beforeAfterMeal) {
      case 'before_meal':
        return 'Before meal';
      case 'after_meal':
        return 'After meal';
      case 'with_meal':
        return 'With meal';
      case 'empty_stomach':
        return 'On empty stomach';
      default:
        return '';
    }
  }

  getReminderStatusColor(status) {
    switch (status) {
      case 'taken':
        return '#10B981'; // Green
      case 'missed':
        return '#EF4444'; // Red
      case 'pending':
        return '#F59E0B'; // Amber
      case 'sent':
        return '#3B82F6'; // Blue
      case 'snoozed':
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280'; // Gray
    }
  }

  getReminderStatusIcon(status) {
    switch (status) {
      case 'taken':
        return 'check-circle';
      case 'missed':
        return 'x-circle';
      case 'pending':
        return 'clock';
      case 'sent':
        return 'bell';
      case 'snoozed':
        return 'bell-slash';
      default:
        return 'help-circle';
    }
  }
}

export const reminderService = new ReminderService();