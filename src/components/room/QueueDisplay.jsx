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
    height: 420px;
    padding: 1rem;
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  `;
  
  // Carousel container (rotary wheel)
  const carouselWheel = css`
    position: relative;
    width: 300px;
    height: 300px;
    margin: 0 auto;
    transition: transform 0.5s ease;
    transform: rotate(${rotationAngle}deg);
  `;
  
  // Base plate style for all players
  const plate = css`
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: absolute;
    padding: 0.5rem;
    text-align: center;
    font-family: Poppins, sans-serif;
    font-weight: 600;
    
    &.top-player {
      width: 100px;
      height: 100px;
      background-color: #d67b7b;
      color: white;
      font-size: 0.9rem;
      z-index: 10;
      border: 3px solid #a47148;
    }
    
    &.other-player {
      width: 80px;
      height: 80px;
      background-color: #eacdca;
      color: #4b3b2b;
      font-size: 0.8rem;
    }
    
    &.current {
      border: 3px solid #a47148;
    }
    
    &.on-appointment {
      border: 3px solid #9c27b0;
    }
  `;
  
  // You badge styles - moved to a pill above the circle
  const youBadge = css`
    position: absolute;
    top: -23px;
    left: 50%;
    transform: translateX(-50%);
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
  
  // Next badge for the top player
  const nextBadge = css`
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #a47148;
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 12px;
    white-space: nowrap;
  `;
  
  // Arrow button styles
  const arrowButton = css`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #a47148;
    color: white;
    border: none;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 20px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: background-color 0.2s;
    z-index: 30;
    
    &:hover {
      background-color: #8a5d3b;
    }
    
    &:disabled {
      background-color: #d3a7a7;
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &.left {
      left: 25%;
    }
    
    &.right {
      right: 25%;
    }
  `;
  
  // Appointment banner style
  const appointmentBanner = css`
    position: absolute;
    bottom: -18px;
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
  
  // Calculate plate positions in a circle
  const getPlateStyle = (index) => {
    // Calculate the position on the circle
    const angleInDegrees = (index * 360) / queue.length;
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    
    // Base size information for positioning
    const isTopPlayer = index === 0;
    const radius = 130; // Circle radius
    
    // Calculate position using sine and cosine
    const x = radius * Math.sin(angleInRadians);
    const y = -radius * Math.cos(angleInRadians);
    
    // Size adjustments
    const size = isTopPlayer ? 100 : 80;
    const offset = size / 2;
    
    // Return transformations to position on the circle
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      transform: `translate(-50%, -50%)`,
      marginLeft: 0,
      marginTop: 0,
    };
  };
  
  return (
    <div className={container}>
      {/* Carousel wheel with all players */}
      <div className={carouselWheel}>
        {queue.map((player, index) => {
          // Calculate the visual position index (0 is always at the top)
          const visualIndex = (index - normalizedTopIndex + queue.length) % queue.length;
          const isTopPlayer = visualIndex === 0;
          
          return (
            <div
              key={player}
              className={`${plate} ${isTopPlayer ? 'top-player' : 'other-player'} ${
                player === currentPlayer ? 'current' : ''
              } ${
                isOnAppointment && isOnAppointment(player) ? 'on-appointment' : ''
              }`}
              style={getPlateStyle(visualIndex)}
            >
              {/* NEXT badge for top player */}
              {isTopPlayer && (
                <div className={nextBadge} style={{
                  top: player === currentPlayer ? '-40px' : '-20px'
                }}>
                  NEXT
                </div>
              )}
              
              {/* Position "YOU" badge above the circle if this is the current player */}
              {player === currentPlayer && (
                <div className={youBadge} style={{ 
                  top: isTopPlayer ? '-20px' : '-23px'
                }}>
                  YOU
                </div>
              )}
              
              {/* Player name inside the circle */}
              <div style={{ 
                transform: `rotate(${-rotationAngle}deg)`,
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {player.length > (isTopPlayer ? 10 : 8) ? 
                  player.substring(0, isTopPlayer ? 8 : 6) + '...' : 
                  player}
              </div>
              
              {/* Badge indicators inside the plate and rotated to stay upright */}
              <div style={{ transform: `rotate(${-rotationAngle}deg)`, position: 'absolute', bottom: '5px' }}>
                {isAdmin && typeof isAdmin === 'function' && isAdmin(player) && <AdminBadge />}
                {isModerator && typeof isModerator === 'function' && isModerator(player) && <ModeratorBadge />}
              </div>
              
              {/* Appointment indicator */}
              {isOnAppointment && getAppointmentTime && isOnAppointment(player) && (
                <div className={appointmentBanner} style={{ transform: `translateX(-50%) rotate(${-rotationAngle}deg)` }}>
                  {isTopPlayer ? 'ON APPOINTMENT' : 'ON APT'}
                  {isTopPlayer && getAppointmentTime(player) && (
                    <span className="appointment-time">
                      {getAppointmentTime(player)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
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