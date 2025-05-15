// src/components/room/QueueDisplay.jsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import ModeratorBadge from '../ui/ModeratorBadge';
import AdminBadge from '../ui/AdminBadge';

export default function QueueDisplay({ queue, currentPlayer, isModerator, isAdmin, isOnAppointment, getAppointmentTime }) {
  // State to track rotation angle
  const [rotationAngle, setRotationAngle] = useState(0);
  
  // Reset rotation when queue changes
  useEffect(() => {
    setRotationAngle(0);
  }, [queue.length]);
  
  // Handle rotation
  const rotateLeft = () => {
    if (queue.length > 1) {
      setRotationAngle(prevAngle => prevAngle + (360 / queue.length));
    }
  };
  
  const rotateRight = () => {
    if (queue.length > 1) {
      setRotationAngle(prevAngle => prevAngle - (360 / queue.length));
    }
  };
  
  // Container styles
  const container = css`
    position: relative;
    width: 100%;
    height: 550px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0;
    margin: 0;
    overflow: hidden;
  `;
  
  // "UP NOW" label at top
  const upNowLabel = css`
    font-family: 'Poppins', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: #59b368; /* Green color like in the image */
    text-align: center;
    margin: 20px 0 10px;
  `;
  
  // Carousel container (rotary wheel)
  const carouselWheel = css`
    position: relative;
    width: 350px;
    height: 350px;
    margin: 0 auto;
    transition: transform 0.5s ease;
    transform: rotate(${rotationAngle}deg);
  `;
  
  // Player circles
  const playerCircle = css`
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: #9a7096; /* Purple color from image */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: absolute;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &.current {
      border: 3px solid #a47148;
    }
    
    &.on-appointment {
      border: 3px solid #9c27b0;
    }
  `;
  
  // Player name styles
  const playerName = css`
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    text-align: center;
    transform: rotate(${-rotationAngle}deg);
    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
  
  // Arrow button styles
  const arrowButton = css`
    background-color: transparent;
    border: none;
    cursor: pointer;
    position: absolute;
    bottom: 120px;
    padding: 0;
    z-index: 30;
    
    img {
      width: 80px;
      height: auto;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &.left {
      left: 50px;
    }
    
    &.right {
      right: 50px;
    }
  `;
  
  // You badge styles for the current player
  const youBadge = css`
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%) rotate(${-rotationAngle}deg);
    background-color: #a47148;
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 12px;
    white-space: nowrap;
    z-index: 2;
  `;
  
  // Appointment banner style
  const appointmentBanner = css`
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%) rotate(${-rotationAngle}deg);
    background-color: #9c27b0;
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.7rem;
    padding: 2px 10px;
    border-radius: 12px;
    white-space: nowrap;
    z-index: 2;
  `;
  
  // Empty state message
  if (queue.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#8b8b8b', fontStyle: 'italic' }}>Queue is empty</p>
      </div>
    );
  }
  
  // Get the current top player index
  const topPlayerIndex = Math.round(rotationAngle / (360 / queue.length)) % queue.length;
  // Ensure the index is within bounds and handle negative rotation
  const normalizedTopIndex = ((topPlayerIndex % queue.length) + queue.length) % queue.length;
  
  // Calculate plate positions in a cross formation (top, right, bottom, left)
  const getCirclePosition = (index, totalPlayers) => {
    // For 4 or fewer players, position them in a cross pattern
    if (totalPlayers <= 4) {
      switch(index) {
        case 0: // Top
          return { left: '50%', top: '0%', transform: 'translateX(-50%)' };
        case 1: // Right
          return { right: '0%', top: '50%', transform: 'translateY(-50%)' };
        case 2: // Bottom
          return { left: '50%', bottom: '0%', transform: 'translateX(-50%)' };
        case 3: // Left
          return { left: '0%', top: '50%', transform: 'translateY(-50%)' };
        default:
          return { display: 'none' }; // Shouldn't happen
      }
    } else {
      // For more than 4 players, position them in a circle
      const angleInDegrees = (index * 360) / totalPlayers;
      const angleInRadians = (angleInDegrees * Math.PI) / 180;
      
      // Radius of the circle
      const radius = 120;
      
      // Calculate position using sine and cosine
      const x = radius * Math.sin(angleInRadians);
      const y = -radius * Math.cos(angleInRadians);
      
      return {
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
      };
    }
  };
  
  // We'll show only up to 4 players at a time in the cross formation
  const visiblePlayers = queue.length > 4 ? 4 : queue.length;

  // Check if current user is admin or moderator
  const isCurrentUserAdminOrMod = 
    (typeof isAdmin === 'function' && isAdmin(currentPlayer)) || 
    (typeof isModerator === 'function' && isModerator(currentPlayer));
  
  return (
    <div className={container}>
      {/* "UP NOW" label at the top */}
      <div className={upNowLabel}>UP NOW</div>
      
      {/* Carousel wheel with all players */}
      <div className={carouselWheel}>
        {queue.map((player, index) => {
          // Calculate the visual position index (0 is always at the top)
          const visualIndex = (index - normalizedTopIndex + queue.length) % queue.length;
          
          // Only show players in positions 0-3 (top, right, bottom, left)
          if (visualIndex >= visiblePlayers) return null;
          
          return (
            <div
              key={player}
              className={`${playerCircle} ${
                player === currentPlayer ? 'current' : ''
              } ${
                isOnAppointment && isOnAppointment(player) ? 'on-appointment' : ''
              }`}
              style={getCirclePosition(visualIndex, visiblePlayers)}
            >
              {/* "YOU" badge for the current player */}
              {player === currentPlayer && (
                <div className={youBadge}>
                  YOU
                </div>
              )}
              
              {/* Player name inside the circle */}
              <div className={playerName}>
                {player}
              </div>
              
              {/* Badge indicators rotated to stay upright */}
              {(isAdmin && typeof isAdmin === 'function' && isAdmin(player)) && (
                <div style={{ transform: `rotate(${-rotationAngle}deg)` }}>
                  <AdminBadge />
                </div>
              )}
              {(isModerator && typeof isModerator === 'function' && isModerator(player)) && (
                <div style={{ transform: `rotate(${-rotationAngle}deg)` }}>
                  <ModeratorBadge />
                </div>
              )}
              
              {/* Appointment indicator */}
              {isOnAppointment && getAppointmentTime && isOnAppointment(player) && (
                <div className={appointmentBanner}>
                  ON APPOINTMENT
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Rotation arrows - only visible to admins and moderators */}
      {isCurrentUserAdminOrMod && (
        <>
          <button 
            className={`${arrowButton} left`} 
            onClick={rotateLeft}
            disabled={queue.length <= 1}
            aria-label="Previous player"
          >
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 0L0 40L40 80" stroke="black" strokeWidth="5"/>
              <line x1="2" y1="40" x2="80" y2="40" stroke="black" strokeWidth="5"/>
            </svg>
          </button>
          <button 
            className={`${arrowButton} right`} 
            onClick={rotateRight}
            disabled={queue.length <= 1}
            aria-label="Next player"
          >
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 80L80 40L40 0" stroke="black" strokeWidth="5"/>
              <line x1="78" y1="40" x2="0" y2="40" stroke="black" strokeWidth="5"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}