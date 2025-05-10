// src/pages/public/LandingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const [name, setName] = useState('');
  const nav = useNavigate();
  const { moderator } = useAuth();
  
  // flex container
  const container = css`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    background-color: #fff8f0;
    padding: 2rem;
    box-sizing: border-box;
  `;

  // centered flex column wrapper
  const inner = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
    width: 100%;
    max-width: 400px;
  `;

  // Title
  const title = css`
    font-size: clamp(2rem, 8vw, 4rem);
    text-align: center;
    font-family: 'Lilita One', cursive;
    color: #a47148;
  `;

  // Subheading (italic)
  const subtitle = css`
    color: #4b3b2b;
    text-align: center;
    font-size: clamp(1rem, 4vw, 1.5rem);
    font-style: italic;
    font-family: Poppins, sans-serif;
  `;

  // Pill-shaped input wrapper
  const pill = css`
    width: 100%;
    max-width: 300px;
    border-radius: 1.5rem;
    background-color: #eacdca;
    height: 3rem;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 1rem;
  `;

  // Input itself, transparent background to "sit" in the pill
  const input = css`
    flex: 1;
    border: none;
    background: transparent;
    font-family: Poppins, sans-serif;
    font-size: 1.125rem;
    text-align: center;
    outline: none;
  `;

  const accessLinks = css`
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1rem;
  `;

  const accessLink = css`
    color: #a47148;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  `;

  // Submit on Enter
  const handleKeyDown = e => {
    if (e.key === 'Enter' && name.trim()) {
      nav('/select', { state: { name } });
    }
  };

  return (
    <div className={container}>
      <div className={inner}>
        <div className={title}>Welcome to Who's Up!</div>
        <div className={subtitle}>Ready to jump in?</div>

        <div className={pill}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className={input}
          />
        </div>
        
        {/* Dashboard link if already logged in as moderator */}
        {moderator && (
          <div
            className={accessLink}
            onClick={() => nav('/mod-dashboard')}
            style={{ marginTop: '0.5rem' }}
          >
            Go to Moderator Dashboard
          </div>
        )}
        
        {/* Access links for admin/moderator */}
        {!moderator && (
          <div className={accessLinks}>
            <div className={accessLink} onClick={() => nav('/mod-login')}>
              Moderator Access
            </div>
            <div className={accessLink} onClick={() => nav('/admin-login')}>
              Admin Access
            </div>
          </div>
        )}
      </div>
    </div>
  );
}