// src/components/room/QueueDisplay.jsx
import React from 'react';
import { css } from '@emotion/css';
import ModeratorBadge from '../ui/ModeratorBadge';
import AdminBadge from '../ui/AdminBadge';

export default function QueueDisplay({ queue, currentPlayer, isModerator, isAdmin, isOnAppointment, getAppointmentTime }) {
  const container = css`
    display: flex;
    align-items: center;
    gap: 1rem; /* Smaller gap on mobile */
    padding: 1rem;
    overflow-x: auto;
    position: relative;
    min-height: 120px; /* Ensure minimum height for container */
    
    @media (min-width: 768px) {
      gap: 2rem; /* Original gap on desktop */
      padding: 2rem;
    }
  `;
  
  const playerCircle = css`
    width: min(80px, 22vw); /* Responsive size that won't get too small */
    height: min(80px, 22vw); /* Same as width to maintain circle shape */
    min-width: 70px; /* Minimum size to prevent too small circles */
    min-height: 70px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: Poppins, sans-serif;
    position: relative;
    flex-shrink: 0; /* Prevent circle from shrinking */
    
    &.first {
      width: min(100px, 28vw);
      height: min(100px, 28vw);
      min-width: 85px;
      min-height: 85px;
      background-color: #d67b7b;
      color: white;
      font-size: 1rem;
    }
    
    &.waiting {
      background-color: #eacdca;
      color: #4b3b2b;
    }
    
    &.current {
      border: 3px solid #a47148;
    }
    
    &.on-appointment {
      border: 3px solid #9c27b0;
    }
    
    @media (min-width: 768px) {
      width: 120px; /* Original size on desktop */
      height: 120px;
      
      &.first {
        width: 150px;
        height: 150px;
        font-size: 1.25rem;
      }
      
      &.current {
        border: 4px solid #a47148;
      }
      
      &.on-appointment {
        border: 4px solid #9c27b0;
      }
    }
  `;
  
  const positionBadge = css`
    position: absolute;
    top: -10px;
    background-color: #a47148;
    color: white;
    border-radius: 1rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    
    @media (min-width: 768px) {
      font-size: 0.875rem;
    }
  `;
  
  const playerName = css`
    font-weight: 600;
    text-align: center;
    margin-bottom: 0.25rem;
    font-size: 0.85rem;
    word-break: break-word;
    max-width: 100%;
    padding: 0 5px;
    
    @media (min-width: 768px) {
      font-size: 1rem;
    }
  `;
  
  const youBadge = css`
    font-size: 0.7rem;
    color: #a47148;
    font-weight: 600;
    
    @media (min-width: 768px) {
      font-size: 0.75rem;
    }
  `;
  
  const arrow = css`
    font-size: 1.5rem;
    color: #d67b7b;
    
    @media (min-width: 768px) {
      font-size: 2rem;
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
  
  if (queue.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#8b8b8b', fontStyle: 'italic' }}>Queue is empty</p>
      </div>
    );
  }
  
  return (
    <div className={container}>
      {queue.map((player, index) => (
        <React.Fragment key={player}>
          <div 
            className={`${playerCircle} ${
              index === 0 ? 'first' : 'waiting'
            } ${player === currentPlayer ? 'current' : ''} ${
              isOnAppointment && isOnAppointment(player) ? 'on-appointment' : ''
            }`}
          >
            {index === 0 && <div className={positionBadge}>NEXT</div>}
            <div className={playerName}>{player}</div>
            {player === currentPlayer && <div className={youBadge}>YOU</div>}
            {isAdmin && typeof isAdmin === 'function' && isAdmin(player) && <AdminBadge />}
            {isModerator && typeof isModerator === 'function' && isModerator(player) && <ModeratorBadge />}
            
            {/* Show appointment banner if player is on appointment */}
            {isOnAppointment && getAppointmentTime && isOnAppointment(player) && (
              <div className={appointmentBanner}>
                ON APPOINTMENT
                <span className="appointment-time">
                  {getAppointmentTime(player)}
                </span>
              </div>
            )}
          </div>
          {index < queue.length - 1 && <div className={arrow}>→</div>}
        </React.Fragment>
      ))}
    </div>
  );
}