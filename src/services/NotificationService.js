// src/utils/notifications.js

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestNotificationPermission = async () => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    // If permission is already granted
    if (Notification.permission === 'granted') {
      localStorage.setItem('notificationsEnabled', 'true');
      return true;
    }
    
    // Otherwise, request permission
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      // Store preference in localStorage
      if (granted) {
        localStorage.setItem('notificationsEnabled', 'true');
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };
  
  /**
   * Check if notifications are enabled
   * @returns {boolean} - Whether notifications are enabled
   */
  export const areNotificationsEnabled = () => {
    return (
      ('Notification' in window) &&
      Notification.permission === 'granted' &&
      localStorage.getItem('notificationsEnabled') === 'true'
    );
  };
  
  /**
   * Show a notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {Object} options - Additional notification options
   * @returns {Notification|null} - The notification object or null
   */
  export const showNotification = (title, body, options = {}) => {
    if (!areNotificationsEnabled()) {
      console.log('Notifications are not enabled');
      return null;
    }
    
    try {
      // Create and show notification with provided options
      const notification = new Notification(title, {
        body,
        icon: '/logo192.png', // Default icon
        ...options
      });
      
      // Optional: Handle click event
      notification.onclick = () => {
        // Focus on window when notification is clicked
        window.focus();
        notification.close();
      };
      
      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  };