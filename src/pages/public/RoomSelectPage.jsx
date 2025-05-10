// src/pages/public/RoomSelectPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';

export default function RoomSelectPage() {
  const nav = useNavigate();
  const { state } = useLocation();
  const { moderator } = useAuth();
  
  // Get name from passed state or from moderator if logged in
  const name = state?.name || (moderator ? moderator.displayName || moderator.username : 'Friend');

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
  `;

  const handleRoomSelect = (room) => {
    // Pass along the name to the room page
    console.log(`Navigating to ${room} with name: ${name}`);
    nav(`/${room}`, { state: { name } });
  };

  return (
    <div className={container}>
      <h1 className={heading}>Select Your Room</h1>
      <div className={subtitle}>Welcome, {name}!</div>
      
      <div className={buttonContainer}>
        <button
          onClick={() => handleRoomSelect('bh')}
          className={button}
        >
          BH
        </button>
        <button
          onClick={() => handleRoomSelect('59')}
          className={button}
        >
          59
        </button>
        <button
          onClick={() => handleRoomSelect('ashland')}
          className={button}
        >
          Ashland
        </button>
      </div>
    </div>
  );
}