// src/pages/admin/HistoryArchive.jsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { db } from '../../firebase/config';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import BackButton from '../../components/ui/BackButton';

export default function HistoryArchive() {
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch historical records on component mount
  useEffect(() => {
    const fetchHistoricalRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Reference to historical_records collection
        const historyCollectionRef = collection(db, 'historical_records');
        
        // Query to get all records sorted by date (newest first)
        const q = query(historyCollectionRef, orderBy('date', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        
        const records = [];
        querySnapshot.forEach((doc) => {
          records.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setHistoricalRecords(records);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching historical records:", error);
        setError("Failed to load historical records");
        setLoading(false);
      }
    };
    
    fetchHistoricalRecords();
  }, []);
  
  // Export history to a format that can be copied to Google Docs
  const handleExportHistory = (historyData) => {
    // Format the history data for export
    const recordDate = selectedRecord ? selectedRecord.date : new Date().toLocaleDateString();
    const roomName = selectedRecord ? selectedRecord.roomName : 'Unknown Room';
    
    let exportText = `# Activity Log for ${roomName} - ${recordDate}\n\n`;
    
    // Group by time
    const groupedHistory = {};
    historyData.forEach(entry => {
      // Get the display time
      let timeString = entry.displayTime;
      if (!timeString && entry.timestamp) {
        if (typeof entry.timestamp === 'string') {
          const date = new Date(entry.timestamp);
          timeString = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } else if (entry.timestamp.toDate) {
          timeString = entry.timestamp.toDate().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }
      
      if (!timeString) {
        timeString = 'Unknown time';
      }
      
      if (!groupedHistory[timeString]) {
        groupedHistory[timeString] = [];
      }
      
      let actionText = '';
      switch (entry.action) {
        case 'joinedQueue':
          actionText = `${entry.player} joined the queue`;
          break;
        case 'leftQueue':
          actionText = `${entry.player} left the queue`;
          break;
        case 'skippedTurn':
          actionText = `${entry.player} skipped their turn`;
          break;
        case 'wentOnAppointment':
          actionText = `${entry.player} went on appointment`;
          break;
        case 'returnedFromAppointment':
          actionText = `${entry.player} returned from appointment`;
          break;
        case 'wentOutOfRotation':
          actionText = `${entry.player} went out of rotation`;
          break;
        case 'leftGame':
          actionText = `${entry.player} left the game`;
          break;
        case 'reorderedQueue':
          actionText = `${entry.player} reordered the queue`;
          break;
        default:
          actionText = `${entry.player} performed an action`;
      }
      
      groupedHistory[timeString].push(actionText);
    });
    
    // Format the export
    Object.keys(groupedHistory).sort().forEach(timeString => {
      exportText += `## ${timeString}\n`;
      groupedHistory[timeString].forEach(action => {
        exportText += `- ${action}\n`;
      });
      exportText += '\n';
    });
    
    // Create a "downloadable" text
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomName.replace(/\s+/g, '-')}_Activity_Log_${recordDate.replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
  
  const recordGrid = css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  `;
  
  const recordCard = css`
    background-color: #f6dfdf;
    padding: 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    &.active {
      border: 2px solid #d67b7b;
    }
  `;
  
  const roomName = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: #4b3b2b;
    margin-bottom: 0.5rem;
  `;
  
  const dateText = css`
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #8b7355;
  `;
  
  const entryCount = css`
    display: inline-block;
    background-color: #d67b7b;
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    margin-left: 0.5rem;
  `;
  
  const selectedRecordContainer = css`
    background-color: #f6dfdf;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 1rem;
  `;
  
  const selectedRecordHeader = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding-bottom: 0.5rem;
  `;
  
  const selectedRecordTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1.25rem;
    color: #4b3b2b;
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &:hover {
      background-color: #768a62;
    }
  `;
  
  const historyList = css`
    max-height: 400px;
    overflow-y: auto;
    padding: 0 0.5rem;
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
  
  const emptyState = css`
    text-align: center;
    padding: 3rem 1rem;
    color: #8b7355;
    font-family: Poppins, sans-serif;
    font-style: italic;
  `;
  
  // Format timestamp for display
  const formatTimestamp = (timestamp, displayTime) => {
    if (displayTime) return displayTime;
    
    if (typeof timestamp === 'string') {
      try {
        return new Date(timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (e) {
        return timestamp;
      }
    }
    
    return timestamp ? timestamp.toString() : '';
  };
  
  // Get icon for action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'joinedQueue': return '➡️';
      case 'leftQueue': return '⬅️';
      case 'skippedTurn': return '↩️';
      case 'wentOnAppointment': return '📅';
      case 'returnedFromAppointment': return '🔄';
      case 'wentOutOfRotation': return '🚪';
      case 'leftGame': return '🚫';
      default: return '•';
    }
  };
  
  // Get text description of action
  const getActionText = (entry) => {
    switch (entry.action) {
      case 'joinedQueue': return `${entry.player} joined the queue`;
      case 'leftQueue': return `${entry.player} left the queue`;
      case 'skippedTurn': return `${entry.player} skipped their turn`;
      case 'wentOnAppointment': return `${entry.player} went on appointment`;
      case 'returnedFromAppointment': return `${entry.player} returned from appointment`;
      case 'wentOutOfRotation': return `${entry.player} went out of rotation`;
      case 'leftGame': return `${entry.player} left the game`;
      case 'reorderedQueue': return `${entry.player} reordered the queue`;
      default: return `${entry.player} performed an action`;
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className={container}>
        <div className={header}>
          <h2 className={title}>History Archive</h2>
          <BackButton label="Back to Dashboard" />
        </div>
        <div>Loading historical records...</div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={container}>
        <div className={header}>
          <h2 className={title}>History Archive</h2>
          <BackButton label="Back to Dashboard" />
        </div>
        <div style={{ color: '#d67b7b' }}>{error}</div>
      </div>
    );
  }
  
  // Render main component
  return (
    <div className={container}>
      <div className={header}>
        <h2 className={title}>History Archive</h2>
        <BackButton label="Back to Dashboard" />
      </div>
      
      {historicalRecords.length > 0 ? (
        <>
          <div className={recordGrid}>
            {historicalRecords.map((record) => (
              <div 
                key={record.id} 
                className={`${recordCard} ${selectedRecord?.id === record.id ? 'active' : ''}`}
                onClick={() => setSelectedRecord(record)}
              >
                <div className={roomName}>
                  {record.roomName || 'Unknown Room'}
                  <span className={entryCount}>
                    {record.history?.length || 0} entries
                  </span>
                </div>
                <div className={dateText}>
                  {new Date(record.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {selectedRecord && (
            <div className={selectedRecordContainer}>
              <div className={selectedRecordHeader}>
                <div className={selectedRecordTitle}>
                  {selectedRecord.roomName || 'Unknown Room'} - {new Date(selectedRecord.date).toLocaleDateString()}
                </div>
                <button 
                  className={exportButton}
                  onClick={() => handleExportHistory(selectedRecord.history)}
                >
                  <span role="img" aria-label="Export">📄</span> Export to Text
                </button>
              </div>
              
              <div className={historyList}>
                {selectedRecord.history && selectedRecord.history.length > 0 ? (
                  selectedRecord.history
                    .sort((a, b) => {
                      // Sort by timestamp, newest first
                      if (a.timestamp && b.timestamp) {
                        if (typeof a.timestamp === 'string' && typeof b.timestamp === 'string') {
                          return new Date(b.timestamp) - new Date(a.timestamp);
                        }
                      }
                      return 0;
                    })
                    .map((entry, index) => (
                      <div key={index} className={historyItem}>
                        <span className={timeStamp}>
                          {formatTimestamp(entry.timestamp, entry.displayTime)}
                        </span>
                        <span className={icon}>{getActionIcon(entry.action)}</span>
                        <span>{getActionText(entry)}</span>
                      </div>
                    ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#8b7355', fontStyle: 'italic' }}>
                    No history entries found for this record
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={emptyState}>
          No historical records found. Records will appear here when they are archived at the end of each day.
        </div>
      )}
    </div>
  );
}