// src/components/room/QueueDisplay.jsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import ModeratorBadge from '../ui/ModeratorBadge';
import AdminBadge from '../ui/AdminBadge';

export default function QueueDisplay({ queue, currentPlayer, isModerator, isAdmin, isOnAppointment, getAppointmentTime }) {
  // State to track rotation angle
  const [rotationAngle, setRotationAngle] = useState(0);
  // Track which player is at the top (first in queue)
  const [topPlayerIndex, setTopPlayerIndex] = useState(0);
  
  // Reset rotation when queue changes
  useEffect(() => {
    setRotationAngle(0);
    setTopPlayerIndex(0);
  }, [queue.length]);
  
  // Handle rotation
  const rotateLeft = () => {
    if (queue.length > 1) {
      setRotationAngle(prevAngle => prevAngle + (360 / queue.length));
      setTopPlayerIndex(prevIndex => 
        prevIndex === 0 ? queue.length - 1 : prevIndex - 1
      );
    }
  };
  
  const rotateRight = () => {
    if (queue.length > 1) {
      setRotationAngle(prevAngle => prevAngle - (360 / queue.length));
      setTopPlayerIndex(prevIndex => 
        (prevIndex + 1) % queue.length
      );
    }
  };
  
  // Container styles
  const container = css`
    position: relative;
    width: 100%;
    height: 500px;
    padding: 1rem;
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  `;
  
  // Center plate (for first player)
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
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    padding: 1rem;
    text-align: center;
    border: 3px solid #a47148;
    
    &.on-appointment {
      border: 3px solid #9c27b0;
    }
  `;
  
  // Carousel container (rotary wheel)
  const carouselWheel = css`
    position: absolute;
    width: 300px;
    height: 300px;
    top: 180px;
    left: 50%;
    margin-left: -150px;
    transition: transform 0.5s ease;
    transform: rotate(${rotationAngle}deg);
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
    left: 50%;
    top: 50%;
    margin-left: -40px;
    margin-top: -40px;
    padding: 0.5rem;
    text-align: center;
    font-family: Poppins, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    
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
    
    @media (min-width: 768px) {
      font-size: 0.75rem;
    }
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
    
    @media (min-width: 768px) {
      font-size: 0.75rem;
    }
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
    bottom: 50px;
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
      left: 20%;
    }
    
    &.right {
      right: 20%;
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
    
    @media (min-width: 768px) {
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
  
  // Calculate plate positions in a circle
  const getPlateStyle = (index) => {
    // Calculate the position on the circle
    const angleInDegrees = (index * 360) / queue.length;
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    
    // Radius of the circle (half the container width minus half the plate width)
    const radius = 120;
    
    // Calculate position using sine and cosine
    const x = radius * Math.sin(angleInRadians);
    const y = -radius * Math.cos(angleInRadians);
    
    // Return transformations to position on the circle
    return {
      transform: `translate(${x}px, ${y}px)`,
    };
  };
  
  return (
    <div className={container}>
      {/* Top/center plate (first player) */}
      <div 
        className={`${centerPlate} ${
          isOnAppointment && isOnAppointment(queue[topPlayerIndex]) ? 'on-appointment' : ''
        }`}
      >
        {/* NEXT badge at the top, slightly offset if "YOU" badge is also present */}
        <div className={nextBadge} style={{
          top: queue[topPlayerIndex] === currentPlayer ? '-40px' : '-20px'
        }}>
          NEXT
        </div>
        
        {/* Show YOU badge if this is the current player, position it above NEXT */}
        {queue[topPlayerIndex] === currentPlayer && (
          <div className={youBadge} style={{ top: '-20px' }}>
            YOU
          </div>
        )}
        
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {queue[topPlayerIndex]}
        </div>
        
        {isAdmin && typeof isAdmin === 'function' && isAdmin(queue[topPlayerIndex]) && <AdminBadge />}
        {isModerator && typeof isModerator === 'function' && isModerator(queue[topPlayerIndex]) && <ModeratorBadge />}
        
        {/* Appointment indicator for center plate */}
        {isOnAppointment && getAppointmentTime && isOnAppointment(queue[topPlayerIndex]) && (
          <div className={appointmentBanner} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
            ON APPOINTMENT
            <span className="appointment-time">
              {getAppointmentTime(queue[topPlayerIndex])}
            </span>
          </div>
        )}
      </div>
      
      {/* Carousel wheel with other players */}
      <div className={carouselWheel}>
        {queue.map((player, index) => {
          if (index === topPlayerIndex) return null; // Skip the top player
          
          return (
            <div
              key={player}
              className={`${plate} ${
                player === currentPlayer ? 'current' : ''
              } ${
                isOnAppointment && isOnAppointment(player) ? 'on-appointment' : ''
              }`}
              style={getPlateStyle(index)}
            >
              {/* Position "YOU" badge above the circle if this is the current player */}
              {player === currentPlayer && (
                <div className={youBadge}>
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
                {player.length > 10 ? player.substring(0, 8) + '...' : player}
              </div>
              
              {/* Badge indicators inside the plate and rotated to stay upright */}
              <div style={{ transform: `rotate(${-rotationAngle}deg)`, position: 'absolute', bottom: '5px' }}>
                {isAdmin && typeof isAdmin === 'function' && isAdmin(player) && <AdminBadge />}
                {isModerator && typeof isModerator === 'function' && isModerator(player) && <ModeratorBadge />}
              </div>
              
              {/* Appointment indicator */}
              {isOnAppointment && getAppointmentTime && isOnAppointment(player) && (
                <div className={appointmentBanner} style={{ transform: `translateX(-50%) rotate(${-rotationAngle}deg)` }}>
                  ON APT
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