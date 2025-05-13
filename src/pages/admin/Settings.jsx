// src/pages/admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import BackButton from '../../components/ui/BackButton';

export default function Settings() {
  const [settings, setSettings] = useState({
    clearRoomTime: '20:01', // 8:01 PM in 24-hour format
    enableNotifications: true,
    notificationSound: true,
    shiftTypes: {
      'bh': ["double", "opening", "close", "afternoon", "sunday"],
      '59': ["double", "opening", "close", "sunday"],
      'ashland': ["double", "opening", "close", "sunday"]
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'appSettings'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setError("Failed to load settings");
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle settings changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'appSettings'), settings);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings");
    }
  };
  
  // Styling
  const container = css`
    background-color: white;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  `;
  
  const header = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  `;
  
  const title = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1.25rem;
    color: #4b3b2b;
    margin: 0;
  `;
  
  const sectionTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: #4b3b2b;
    margin: 1.5rem 0 1rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #eee;
  `;
  
  const formGroup = css`
    margin-bottom: 1rem;
  `;
  
  const label = css`
    display: block;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #4b3b2b;
    margin-bottom: 0.5rem;
  `;
  
  const input = css`
    padding: 0.5rem;
    border: 1px solid #e2e2e2;
    border-radius: 0.5rem;
    font-family: Poppins, sans-serif;
    width: 100%;
    max-width: 300px;
    
    &:focus {
      outline: none;
      border-color: #d67b7b;
    }
  `;
  
  const buttonRow = css`
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
  `;
  
  const saveButton = css`
    background-color: #8d9e78;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1.5rem;
    font-family: Poppins, sans-serif;
    cursor: pointer;
    
    &:hover {
      background-color: #768a62;
    }
  `;
  
  const message = css`
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-family: Poppins, sans-serif;
    
    &.success {
      background-color: #e0f2e9;
      color: #2e7d32;
    }
    
    &.error {
      background-color: #f9e0e0;
      color: #c62828;
    }
  `;
  
  const checkboxLabel = css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #4b3b2b;
    cursor: pointer;
  `;
  
  // Render loading state
  if (loading) {
    return (
      <div className={container}>
        <div className={header}>
          <h2 className={title}>Settings</h2>
          <BackButton label="Back to Dashboard" />
        </div>
        <div>Loading settings...</div>
      </div>
    );
  }
  
  // Render main component
  return (
    <div className={container}>
      <div className={header}>
        <h2 className={title}>Settings</h2>
        <BackButton label="Back to Dashboard" />
      </div>
      
      {error && (
        <div className={`${message} error`}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={`${message} success`}>
          Settings saved successfully!
        </div>
      )}
      
      <div className={sectionTitle}>Room Settings</div>
      
      <div className={formGroup}>
        <label className={label}>Reset Room Time (24-hour format)</label>
        <input
          type="time"
          name="clearRoomTime"
          value={settings.clearRoomTime}
          onChange={handleInputChange}
          className={input}
        />
        <div style={{ fontSize: '0.75rem', color: '#8b7355', marginTop: '0.25rem' }}>
          Time when rooms will be automatically reset each day (default: 20:01 = 8:01 PM)
        </div>
      </div>
      
      <div className={sectionTitle}>Notification Settings</div>
      
      <div className={formGroup}>
        <label className={checkboxLabel}>
          <input
            type="checkbox"
            name="enableNotifications"
            checked={settings.enableNotifications}
            onChange={handleInputChange}
          />
          Enable Web Notifications
        </label>
      </div>
      
      <div className={formGroup}>
        <label className={checkboxLabel}>
          <input
            type="checkbox"
            name="notificationSound"
            checked={settings.notificationSound}
            onChange={handleInputChange}
          />
          Play Sound with Notifications
        </label>
      </div>
      
      <div className={buttonRow}>
        <button 
          className={saveButton}
          onClick={handleSaveSettings}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}