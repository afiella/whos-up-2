// src/components/room/QueueDisplay.jsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import ModeratorBadge from '../ui/ModeratorBadge';
import AdminBadge from '../ui/AdminBadge';

export default function QueueDisplay({ queue, currentPlayer, isModerator, isAdmin, isOnAppointment, getAppointmentTime }) {
  // State to track which player is in center focus (default to first player)
  const [centerIndex, setCenterIndex] = useState(0);
  
  // Reset center index when queue changes
  useEffect(() => {
    setCenterIndex(0);
  }, [queue.length]);
  
  // Handle rotation
  const rotateLeft = () => {
    if (queue.length > 1) {
      setCenterIndex((prevIndex) => 
        prevIndex === 0 ? queue.length - 1 : prevIndex - 1
      );
    }
  };
  
  const rotateRight = () => {
    if (queue.length > 1) {
      setCenterIndex((prevIndex) => 
        (prevIndex + 1) % queue.length
      );
    }
  };
  
  // Container styles
  const container = css`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    padding: 1rem;
    margin: 2rem 0;
  `;
  
  // Center plate styles (larger)
  const centerPlate = css`
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background-color: #d67b7b;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    margin: 2rem auto;
    z-index: 10;
    padding: 1rem;
    text-align: center;
  `;
  
  // Semi-circle of plates
  const plateCircle = css`
    position: absolute;
    width: 100%;
    height: 180px;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  `;
  
  // Individual plate in carousel
  const plate = css`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #eacdca;
    color: #4b3b2b;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: absolute;
    padding: 0.5rem;
    text-align: center;
    transition: all 0.3s ease;
    
    &.current {
      border: 3px solid #a47148;
    }
    
    &.on-appointment {
      border: 3px solid #9c27b0;
    }
  `;
  
  // Arrow button styles
  const arrowButton = css`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #a47148;
    color: white;
    border: none;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 0;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #8a5d3b;
    }
    
    &:disabled {
      background-color: #d3a7a7;
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &.left {
      left: 15%;
    }
    
    &.right {
      right: 15%;
    }
  `;
  
  // Player name styles
  const playerName = css`
    font-weight: 600;
    font-size: 0.85rem;
    word-break: break-word;
    max-width: 100%;
    font-family: Poppins, sans-serif;
    
    @media (min-width: 768px) {
      font-size: 1rem;
    }
  `;
  
  // You badge styles
  const youBadge = css`
    font-size: 0.7rem;
    color: #a47148;
    font-weight: 600;
    
    @media (min-width: 768px) {
      font-size: 0.75rem;
    }
  `;
  
  // Appointment banner style
  const appointmentBanner = css`
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #9c27b0;
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.5rem;
    padding: 0.125rem 0.4rem;
    border-radius: 0.25rem;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    
    .appointment-time {
      display: block;
      font-size: 0.4rem;
      opacity: 0.9;
      text-align: center;
    }
    
    @media (min-width: 768px) {
      bottom: -10px;
      font-size: 0.6rem;
      padding: 0.125rem 0.5rem;
      
      .appointment-time {
        font-size: 0.5rem;
      }
    }
  `;
  
  // Empty state message
  if (queue.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#8b8b8b', fontStyle: 'italic' }}>Queue is empty</p>
      </div>
    );
  }
  
  // Get the player for center position
  const centerPlayer = queue[centerIndex];
  
  // Calculate positions for plates in semi-circle
  const getPlatePosition = (index, totalPlates) => {
    // If only showing one player, don't calculate positions
    if (queue.length <= 1) return {};
    
    const radius = 140; // Radius of the semi-circle
    
    // We'll display max 5 additional plates (or less if not enough players)
    const maxVisiblePlates = Math.min(5, queue.length - 1);
    
    // Get the players before and after the center player, wrapping around the queue
    const plateIndices = [];
    for (let i = -Math.floor(maxVisiblePlates / 2); i <= Math.ceil(maxVisiblePlates / 2); i++) {
      if (i === 0) continue; // Skip the center player
      
      let plateIndex = (centerIndex + i + queue.length) % queue.length;
      plateIndices.push(plateIndex);
    }
    
    // If this plate isn't in our visible indices, don't show it
    if (!plateIndices.includes(index)) return { display: 'none' };
    
    // Calculate position in the semi-circle
    const visibleIndex = plateIndices.indexOf(index);
    const angleRange = 180; // Semi-circle = 180 degrees
    const angleStep = angleRange / (maxVisiblePlates + 1);
    const angle = (visibleIndex + 1) * angleStep;
    const angleRadians = (angle * Math.PI) / 180;
    
    // Position on the semi-circle (top half)
    const left = `calc(50% + ${radius * Math.sin(angleRadians)}px)`;
    const top = `calc(${radius * (1 - Math.cos(angleRadians))}px)`;
    
    return { left, top };
  };
  
  return (
    <div className={container}>
      {/* Semi-circle of plates */}
      <div className={plateCircle}>
        {queue.map((player, index) => {
          if (index === centerIndex) return null; // Center player rendered separately
          
          return (
            <div
              key={player}
              className={`${plate} ${
                player === currentPlayer ? 'current' : ''
              } ${
                isOnAppointment && isOnAppointment(player) ? 'on-appointment' : ''
              }`}
              style={getPlatePosition(index, queue.length)}
            >
              <div className={playerName}>{player.length > 8 ? player.substring(0, 8) + '...' : player}</div>
              {player === currentPlayer && <div className={youBadge}>YOU</div>}
              {isAdmin && typeof isAdmin === 'function' && isAdmin(player) && <AdminBadge />}
              {isModerator && typeof isModerator === 'function' && isModerator(player) && <ModeratorBadge />}
              
              {/* Appointment indicator for smaller plates */}
              {isOnAppointment && getAppointmentTime && isOnAppointment(player) && (
                <div className={appointmentBanner}>
                  ON APT
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Center plate */}
      <div 
        className={`${centerPlate} ${
          centerPlayer === currentPlayer ? 'current' : ''
        } ${
          isOnAppointment && isOnAppointment(centerPlayer) ? 'on-appointment' : ''
        }`}
      >
        <div style={{ position: 'absolute', top: '-20px', backgroundColor: '#a47148', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
          NEXT
        </div>
        <div className={playerName} style={{ fontSize: '1.25rem' }}>{centerPlayer}</div>
        {centerPlayer === currentPlayer && <div className={youBadge} style={{ fontSize: '0.875rem' }}>YOU</div>}
        {isAdmin && typeof isAdmin === 'function' && isAdmin(centerPlayer) && <AdminBadge />}
        {isModerator && typeof isModerator === 'function' && isModerator(centerPlayer) && <ModeratorBadge />}
        
        {/* Appointment indicator for center plate */}
        {isOnAppointment && getAppointmentTime && isOnAppointment(centerPlayer) && (
          <div className={appointmentBanner} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
            ON APPOINTMENT
            <span className="appointment-time">
              {getAppointmentTime(centerPlayer)}
            </span>
          </div>
        )}
      </div>
      
      {/* Rotation arrows */}
      <button 
        className={`${arrowButton} left`} 
        onClick={rotateLeft}
        disabled={queue.length <= 1}
        aria-label="Rotate left"
      >
        &#8592;
      </button>
      <button 
        className={`${arrowButton} right`} 
        onClick={rotateRight}
        disabled={queue.length <= 1}
        aria-label="Rotate right"
      >
        &#8594;
      </button>
    </div>
  );
}