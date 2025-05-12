// src/components/room/ActivityHistory.jsx
import React from 'react';
import { css } from '@emotion/css';

export default function ActivityHistory({ history, isAdmin = false, onExport }) {
  // Format timestamp for better display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // If it's a Firestore timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If it's a date object or string representation
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timestamp;
    }
  };
  
  // Get appropriate icon for action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'joinedQueue':
        return '➡️';
      case 'leftQueue':
        return '⬅️';
      case 'skippedTurn':
        return '↩️';
      case 'wentOnAppointment':
        return '📅';
      case 'returnedFromAppointment':
        return '🔄';
      case 'wentOutOfRotation':
        return '🚪';
      case 'leftGame':
        return '🚫';
      default:
        return '•';
    }
  };
  
  // Get text description of the action
  const getActionText = (entry) => {
    switch (entry.action) {
      case 'joinedQueue':
        return `${entry.player} joined the queue`;
      case 'leftQueue':
        return `${entry.player} left the queue`;
      case 'skippedTurn':
        return `${entry.player} skipped their turn`;
      case 'wentOnAppointment':
        return `${entry.player} went on appointment`;
      case 'returnedFromAppointment':
        return `${entry.player} returned from appointment`;
      case 'wentOutOfRotation':
        return `${entry.player} went out of rotation`;
      case 'leftGame':
        return `${entry.player} left the game`;
      default:
        return `${entry.player} performed an action`;
    }
  };
  
  // Handle exporting the history to a Google Doc-friendly format
  const handleExport = () => {
    if (typeof onExport === 'function') {
      onExport(history);
    }
  };
  
  // Styling
  const container = css`
    margin-top: 1rem;
  `;
  
  const historyList = css`
    max-height: ${isAdmin ? '400px' : '200px'};
    overflow-y: auto;
    margin-top: 0.5rem;
    padding-right: 0.5rem;
  `;
  
  const historyItem = css`
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #4b3b2b;
    
    &:last-child {
      border-bottom: none;
    }
  `;
  
  const timeStamp = css`
    color: #8b7355;
    font-size: 0.75rem;
    margin-right: 0.5rem;
    min-width: 70px;
  `;
  
  const icon = css`
    margin: 0 0.5rem;
  `;
  
  const exportButton = css`
    background-color: #8d9e78;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &:hover {
      background-color: #768a62;
    }
  `;
  
  // Showing the most recent entries first
  const sortedHistory = [...history].sort((a, b) => {
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeB - timeA;
  });
  
  return (
    <div className={container}>
      <div className={historyList}>
        {sortedHistory.length > 0 ? (
          sortedHistory.map((entry, index) => (
            <div key={index} className={historyItem}>
              <span className={timeStamp}>{formatTimestamp(entry.timestamp)}</span>
              <span className={icon}>{getActionIcon(entry.action)}</span>
              <span>{getActionText(entry)}</span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#8b7355', fontStyle: 'italic' }}>
            No activity recorded yet
          </div>
        )}
      </div>
      
      {/* Export button for admins/moderators */}
      {isAdmin && (
        <button className={exportButton} onClick={handleExport}>
          <span role="img" aria-label="Export">📄</span> Export History
        </button>
      )}
    </div>
  );
}