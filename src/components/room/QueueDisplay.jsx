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
    width: 100%;
    min-height: 350px;
    padding: 1rem;
    margin: 1rem 0;
    overflow: hidden;
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
    position: absolute;
    top: 150px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    padding: 1rem;
    text-align: center;
    transition: all 0.3s ease;
    
    &.current {
      border: 3px solid #a47148;
    }
    
    &.on-appointment {
      border: 3px solid #9c27b0;
    }
  `;
  
  // Carousel container
  const carousel = css`
    position: relative;
    height: 100px;
    margin-top: 20px;
    display: flex;
    align-items: center;
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
    bottom: 10px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: background-color 0.2s;
    z-index: 20;
    
    &:hover {
      background-color: #8a5d3b;
    }
    
    &:disabled {
      background-color: #d3a7a7;
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &.left {
      left: 20%;
    }
    
    &.right {
      right: 20%;
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
  
  // Calculate positions for plates in horizontal carousel
  const getPlatePosition = (index, totalPlates) => {
    // If only showing one player, don't calculate positions
    if (queue.length <= 1) return { display: 'none' };
    
    // Determine visibility and position
    const visiblePlatesCount = Math.min(5, queue.length - 1); // Max 5 visible plates excluding center
    
    let relativePosition = index - centerIndex;
    if (relativePosition < 0) relativePosition += queue.length;
    if (relativePosition > 0 && relativePosition > Math.floor(queue.length / 2)) {
      relativePosition = relativePosition - queue.length;
    }
    
    // Hide plates that are too far from the center
    const maxDistance = Math.floor(visiblePlatesCount / 2);
    if (Math.abs(relativePosition) > maxDistance) return { display: 'none' };
    
    // Calculate horizontal position
    const baseWidth = 120; // Space between plates
    const xPosition = relativePosition * baseWidth;
    
    // Add curved effect - plates further from the center appear slightly higher
    const yAdjustment = Math.abs(relativePosition) * 10;
    
    // Make plates smaller the further they are from center
    const scale = 1 - Math.abs(relativePosition) * 0.15;
    
    // Calculate z-index - closer to center = higher z-index
    const zIndex = 5 - Math.abs(relativePosition);
    
    return {
      left: `calc(50% + ${xPosition}px)`,
      top: `${50 - yAdjustment}px`,
      transform: `translateX(-50%) scale(${scale})`,
      opacity: 1 - Math.abs(relativePosition) * 0.2, // Fade out plates further from center
      zIndex
    };
  };
  
  return (
    <div className={container}>
      {/* Carousel of plates */}
      <div className={carousel}>
        {queue.map((player, index) => {
          if (index === centerIndex) return null; // Center player rendered separately
          
          const plateStyle = getPlatePosition(index, queue.length);
          
          return (
            <div
              key={player}
              className={`${plate} ${
                player === currentPlayer ? 'current' : ''
              } ${
                isOnAppointment && isOnAppointment(player) ? 'on-appointment' : ''
              }`}
              style={plateStyle}
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