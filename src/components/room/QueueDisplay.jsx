// src/components/room/QueueDisplay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import ModeratorBadge from '../ui/ModeratorBadge';
import AdminBadge from '../ui/AdminBadge';

export default function QueueDisplay({ queue, currentPlayer, isModerator, isAdmin, isOnAppointment, getAppointmentTime }) {
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
  
  // Arrow button styles
  const arrowButton = css`
    background-color: transparent;
    border: none;
    cursor: pointer;
    position: absolute;
    bottom: 20px;
    padding: 0;
    z-index: 30;
    
    svg {
      width: 70px;
      height: 70px;
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
        width: 75px;
        height: 75px;
      }
    }
    
    @media (min-width: 430px) {
      svg {
        width: 80px;
        height: 80px;
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
  
  // Determine if the current user is an admin or moderator
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
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 80L80 40L40 0" stroke="black" strokeWidth="5"/>
              <line x1="78" y1="40" x2="0" y2="40" stroke="black" strokeWidth="5"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}