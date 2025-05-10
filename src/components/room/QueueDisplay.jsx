// src/components/room/QueueDisplay.jsx
import React from 'react';
import { css } from '@emotion/css';
import ModeratorBadge from '../ui/ModeratorBadge';

export default function QueueDisplay({ queue, currentPlayer, isModerator }) {
  const container = css`
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
    overflow-x: auto;
    position: relative;
  `;
  
  const playerCircle = css`
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: Poppins, sans-serif;
    position: relative;
    
    &.first {
      width: 150px;
      height: 150px;
      background-color: #d67b7b;
      color: white;
      font-size: 1.25rem;
    }
    
    &.waiting {
      background-color: #eacdca;
      color: #4b3b2b;
    }
    
    &.current {
      border: 4px solid #a47148;
    }
  `;
  
  const positionBadge = css`
    position: absolute;
    top: -10px;
    background-color: #a47148;
    color: white;
    border-radius: 1rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
  `;
  
  const playerName = css`
    font-weight: 600;
    text-align: center;
    margin-bottom: 0.25rem;
  `;
  
  const youBadge = css`
    font-size: 0.75rem;
    color: #a47148;
    font-weight: 600;
  `;
  
  const arrow = css`
    font-size: 2rem;
    color: #d67b7b;
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
            } ${player === currentPlayer ? 'current' : ''}`}
          >
            {index === 0 && <div className={positionBadge}>NEXT</div>}
            <div className={playerName}>{player}</div>
            {player === currentPlayer && <div className={youBadge}>YOU</div>}
            {isModerator(player) && <ModeratorBadge />}
          </div>
          {index < queue.length - 1 && <div className={arrow}>→</div>}
        </React.Fragment>
      ))}
    </div>
  );
}