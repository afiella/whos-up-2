// src/components/room/QueueDisplay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import ModeratorBadge from '../ui/ModeratorBadge';
import AdminBadge from '../ui/AdminBadge';

export default function QueueDisplay({ 
  queue, 
  currentPlayer, 
  isModerator, 
  isAdmin, 
  isOnAppointment, 
  getAppointmentTime,
  onSaveAndClearHistory,
  history
}) {
  // State to track rotation angle
  const [rotationAngle, setRotationAngle] = useState(0);
  // Reference to track previous queue length for animations
  const prevQueueLengthRef = useRef(queue.length);
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle queue changes - reset rotation and animate when new players join
  useEffect(() => {
    // Check if a new player has joined
    if (queue.length > prevQueueLengthRef.current) {
      // New player joined - animate the transition
      setIsAnimating(true);
      
      // After animation completes, reset the animation flag
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500); // Match this with the transition duration
      
      return () => clearTimeout(timer);
    }
    
    // Update the previous queue length reference
    prevQueueLengthRef.current = queue.length;
    
    // Reset rotation if queue is cleared
    if (queue.length === 0) {
      setRotationAngle(0);
    }
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
  
  // Determine if current user is admin or moderator
  const isCurrentUserAdminOrMod = 
    (typeof isAdmin === 'function' && isAdmin(currentPlayer)) || 
    (typeof isModerator === 'function' && isModerator(currentPlayer));
  
  // Check if current user is specifically an admin (for enhanced admin controls)
  const isCurrentUserAdmin = typeof isAdmin === 'function' && isAdmin(currentPlayer);
  
  // Function to handle saving and clearing history
  const handleSaveAndClearHistory = () => {
    if (typeof onSaveAndClearHistory === 'function') {
      // Confirm before proceeding
      if (window.confirm('Save current activity history to archive and clear it? This action cannot be undone.')) {
        onSaveAndClearHistory();
      }
    }
  };
  
  // Main container styles - simplified and made responsive
  const container = css`
    position: relative;
    width: 100%;
    background-color: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 0 100px 0;
    margin: 0;
  `;
  
  // "UP NOW" label at top
  const upNowLabel = css`
    font-family: 'Poppins', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: #59b368;
    text-align: center;
    margin: 20px 0;
    
    /* Special style for admin view */
    ${isCurrentUserAdmin ? `
      background-color: rgba(164, 113, 72, 0.1);
      padding: 5px 20px;
      border-radius: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    ` : ''}
  `;
  
  // Carousel container
  const carouselWheel = css`
    position: relative;
    width: 300px;
    height: 300px;
    transition: transform 0.5s ease;
    transform: rotate(${rotationAngle}deg);
    
    @media (min-width: 375px) {
      width: 320px;
      height: 320px;
    }
    
    @media (min-width: 390px) {
      width: 340px;
      height: 340px;
    }
    
    @media (min-width: 414px) {
      width: 360px;
      height: 360px;
    }
    
    @media (min-width: 430px) {
      width: 380px;
      height: 380px;
    }
  `;
  
  // Player circles
  const playerCircle = css`
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background-color: #9a7096;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: absolute;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all ${isAnimating ? '0.5s' : '0.3s'} ease;
    
    &.current {
      border: 3px solid #a47148;
    }
    
    &.on-appointment {
      border: 3px solid #9c27b0;
    }
    
    /* Enhanced admin/mod view of player circles */
    ${isCurrentUserAdminOrMod ? `
      cursor: pointer;
      
      &:hover {
        transform: translate(-50%, -50%) scale(1.05);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }
    ` : ''}
    
    @media (min-width: 390px) {
      width: 115px;
      height: 115px;
    }
    
    @media (min-width: 430px) {
      width: 120px;
      height: 120px;
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
    max-width: 85%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
  
  // Admin mode indicator
  const adminModeIndicator = css`
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #a47148;
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 20px;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 5px;
  `;
  
  // Admin controls container
  const adminControls = css`
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 5px;
    padding: 5px;
    z-index: 20;
  `;
  
  // Admin/mod control buttons
  const controlButton = css`
    background-color: #8d9e78;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 6px 12px;
    font-family: Poppins, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #768a62;
      transform: translateY(-2px);
    }
    
    &.danger {
      background-color: #d67b7b;
      
      &:hover {
        background-color: #c56c6c;
      }
    }
    
    &.archive {
      background-color: #7b68ee; // Purple color for archive actions
      
      &:hover {
        background-color: #6a5acd;
      }
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  `;
  
  // Arrow button styles - enhanced for admin/mod view
  const arrowButton = css`
    background-color: ${isCurrentUserAdminOrMod ? '#a47148' : 'transparent'};
    border: none;
    border-radius: ${isCurrentUserAdminOrMod ? '50%' : '0'};
    cursor: pointer;
    position: absolute;
    bottom: 20px;
    padding: ${isCurrentUserAdminOrMod ? '10px' : '0'};
    z-index: 30;
    box-shadow: ${isCurrentUserAdminOrMod ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none'};
    transition: all 0.2s ease;
    
    svg {
      width: 60px;
      height: 60px;
      
      path, line {
        stroke: ${isCurrentUserAdminOrMod ? 'white' : 'black'};
      }
    }
    
    &:hover {
      transform: ${isCurrentUserAdminOrMod ? 'scale(1.1)' : 'none'};
      background-color: ${isCurrentUserAdminOrMod ? '#8a5d3b' : 'transparent'};
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &.left {
      left: 15px;
    }
    
    &.right {
      right: 15px;
    }
    
    @media (min-width: 390px) {
      svg {
        width: 65px;
        height: 65px;
      }
    }
    
    @media (min-width: 430px) {
      svg {
        width: 70px;
        height: 70px;
      }
      
      &.left {
        left: 20px;
      }
      
      &.right {
        right: 20px;
      }
    }
  `;
  
  // You badge styles for the current player
  const youBadge = css`
    position: absolute;
    top: -22px;
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
  
  // Calculate responsive radius based on screen width
  const getResponsiveRadius = (totalPlayers) => {
    // Base radius values for different screen sizes
    let baseRadius;
    
    // Get current viewport width
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth <= 375) {
      baseRadius = 90; // iPhone SE, smaller devices
    } else if (viewportWidth <= 390) {
      baseRadius = 100; // iPhone 13/14 Pro
    } else if (viewportWidth <= 414) {
      baseRadius = 110; // iPhone Plus models
    } else {
      baseRadius = 120; // iPhone Pro Max, larger devices
    }
    
    // Adjust radius based on number of players
    if (totalPlayers <= 4) {
      return baseRadius;
    } else if (totalPlayers <= 6) {
      return baseRadius * 0.95;
    } else if (totalPlayers <= 8) {
      return baseRadius * 0.9;
    } else {
      return baseRadius * 0.85; // Scale down for many players
    }
  };
  
  // Calculate positions for circles - ensure they don't get cut off
  const getCirclePosition = (index, totalPlayers) => {
    // Always position in a circle with equal spacing
    const angleInDegrees = (index * 360) / totalPlayers;
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    
    // Get responsive radius
    const radius = getResponsiveRadius(totalPlayers);
    
    // Calculate position using sine and cosine
    const x = radius * Math.sin(angleInRadians);
    const y = -radius * Math.cos(angleInRadians);
    
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      transform: 'translate(-50%, -50%)',
    };
  };
  
  return (
    <div className={container}>
      {/* Admin mode indicator - only visible for admins */}
      {isCurrentUserAdmin && (
        <div className={adminModeIndicator}>
          <span>⚙️</span> Admin Mode
        </div>
      )}
      
      {/* "UP NOW" label at the top */}
      <div className={upNowLabel}>UP NOW</div>
      
      {/* Carousel wheel with all players */}
      <div className={carouselWheel}>
        {queue.map((player, index) => {
          // Calculate the visual position index (0 is always at the top)
          const visualIndex = (index - normalizedTopIndex + queue.length) % queue.length;
          
          return (
            <div
              key={player}
              className={`${playerCircle} ${
                player === currentPlayer ? 'current' : ''
              } ${
                isOnAppointment && isOnAppointment(player) ? 'on-appointment' : ''
              }`}
              style={getCirclePosition(visualIndex, queue.length)}
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
      
      {/* Admin-specific controls */}
      {isCurrentUserAdminOrMod && (
        <div className={adminControls}>
          <button className={controlButton}>
            <span>🔄</span> Refresh
          </button>
          {isCurrentUserAdmin && (
            <>
              <button 
                className={`${controlButton} archive`}
                onClick={handleSaveAndClearHistory}
                disabled={!history || history.length === 0}
              >
                <span>📁</span> Archive & Clear History
              </button>
              <button className={`${controlButton} danger`}>
                <span>🚫</span> Clear Queue
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Rotation arrows - only visible to admins and moderators */}
      {isCurrentUserAdminOrMod && (
        <>
          <button 
            className={`${arrowButton} left`} 
            onClick={rotateLeft}
            disabled={queue.length <= 1}
            aria-label="Previous player"
          >
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 0L0 40L40 80" strokeWidth="5"/>
              <line x1="2" y1="40" x2="80" y2="40" strokeWidth="5"/>
            </svg>
          </button>
          <button 
            className={`${arrowButton} right`} 
            onClick={rotateRight}
            disabled={queue.length <= 1}
            aria-label="Next player"
          >
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 80L80 40L40 0" strokeWidth="5"/>
              <line x1="78" y1="40" x2="0" y2="40" strokeWidth="5"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}