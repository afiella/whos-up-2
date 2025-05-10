// src/pages/public/RoomSelectPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';

export default function RoomSelectPage() {
  const nav = useNavigate();
  const { state } = useLocation();
  const { moderator } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  
  // Get name from passed state or from moderator if logged in
  const name = state?.name || (moderator ? moderator.displayName || moderator.username : 'Friend');

  // Define shifts for each room
  const shifts = {
    '59': [
      { value: 'double', label: 'Double (9:30 AM - 8:00 PM)', endTime: '8:00 PM' },
      { value: 'opening', label: 'Opening (9:30 AM - 3:00 PM)', endTime: '3:00 PM' },
      { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' }
    ],
    'bh': [
      { value: 'double', label: 'Double (8:30 AM - 8:00 PM)', endTime: '8:00 PM' },
      { value: 'opening', label: 'Opening (8:30 AM - 3:00 PM)', endTime: '3:00 PM' },
      { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' },
      { value: 'afternoon', label: 'Afternoon (8:30 AM - 5:00 PM)', endTime: '5:00 PM' }
    ],
    'ashland': [
      { value: 'double', label: 'Double (9:30 AM - 8:00 PM)', endTime: '8:00 PM' },
      { value: 'opening', label: 'Opening (9:30 AM - 3:00 PM)', endTime: '3:00 PM' },
      { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' }
    ]
  };

  const container = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    background-color: #fff8f0;
  `;
  
  const heading = css`
    font-family: 'Lilita One', cursive;
    color: #a47148;
    font-size: clamp(1.75rem, 6vw, 3rem);
    margin-bottom: 2rem;
  `;
  
  const subtitle = css`
    font-family: Poppins, sans-serif;
    color: #4b3b2b;
    font-size: clamp(1rem, 3vw, 1.25rem);
    margin-bottom: 3rem;
  `;
  
  const buttonContainer = css`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  `;
  
  const button = css`
    background-color: #d67b7b;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 1rem 2rem;
    font-family: Poppins, sans-serif;
    font-size: 1.25rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #c56c6c;
    }
    
    &.selected {
      background-color: #c56c6c;
      transform: scale(1.05);
    }
  `;

  const shiftContainer = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
    width: 100%;
    max-width: 400px;
  `;

  const shiftTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    color: #4b3b2b;
    font-size: 1.25rem;
  `;

  const shiftButton = css`
    background-color: #eacdca;
    color: #4b3b2b;
    border: none;
    border-radius: 1rem;
    padding: 0.75rem 1.5rem;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
    transition: all 0.2s;
    
    &:hover {
      background-color: #dfc4c4;
    }
    
    &.selected {
      background-color: #d67b7b;
      color: white;
    }
  `;

  const continueButton = css`
    background-color: #8d9e78;
    color: white;
    border: none;
    border-radius: 1.5rem;
    padding: 1rem 2rem;
    font-family: Poppins, sans-serif;
    font-size: 1.25rem;
    cursor: pointer;
    margin-top: 2rem;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #768a62;
    }
    
    &:disabled {
      background-color: #b5c4a5;
      cursor: not-allowed;
    }
  `;

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setSelectedShift(''); // Reset shift when changing rooms
  };

  const handleShiftSelect = (shift) => {
    setSelectedShift(shift);
  };

  const handleContinue = () => {
    if (selectedRoom && selectedShift) {
      const shift = shifts[selectedRoom].find(s => s.value === selectedShift);
      nav(`/${selectedRoom}`, { 
        state: { 
          name, 
          shiftEnd: shift.endTime,
          shiftType: shift.value 
        } 
      });
    }
  };

  return (
    <div className={container}>
      <h1 className={heading}>Select Your Room</h1>
      <div className={subtitle}>Welcome, {name}!</div>
      
      <div className={buttonContainer}>
        <button
          onClick={() => handleRoomSelect('bh')}
          className={`${button} ${selectedRoom === 'bh' ? 'selected' : ''}`}
        >
          BH
        </button>
        <button
          onClick={() => handleRoomSelect('59')}
          className={`${button} ${selectedRoom === '59' ? 'selected' : ''}`}
        >
          59
        </button>
        <button
          onClick={() => handleRoomSelect('ashland')}
          className={`${button} ${selectedRoom === 'ashland' ? 'selected' : ''}`}
        >
          Ashland
        </button>
      </div>

      {selectedRoom && (
        <div className={shiftContainer}>
          <div className={shiftTitle}>Select Your Shift</div>
          {shifts[selectedRoom].map(shift => (
            <button
              key={shift.value}
              onClick={() => handleShiftSelect(shift.value)}
              className={`${shiftButton} ${selectedShift === shift.value ? 'selected' : ''}`}
            >
              {shift.label}
            </button>
          ))}
        </div>
      )}

      {selectedRoom && selectedShift && (
        <button
          className={continueButton}
          onClick={handleContinue}
        >
          Enter Game
        </button>
      )}
    </div>
  );
}