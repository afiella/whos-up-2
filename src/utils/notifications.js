// src/utils/notifications.js - UPDATED

/**
 * Check if the device is running iOS
 * @returns {boolean} - Whether the device is running iOS
 */
export const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };
  
  /**
   * Check if notifications are supported by the browser
   * @returns {boolean} - Whether notifications are supported
   */
  export const areNotificationsSupported = () => {
    // iOS doesn't support web notifications
    if (isIOS()) {
      return false;
    }
    return 'Notification' in window;
  };
  
  /**
   * Request notification permission from the user
   * @returns {Promise<boolean>} - Whether permission was granted
   */
  export const requestNotificationPermission = async () => {
    // Check if browser supports notifications
    if (!areNotificationsSupported()) {
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
    if (!areNotificationsSupported()) {
      return false;
    }
    
    return (
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