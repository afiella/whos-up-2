// src/pages/public/StaffLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';

export default function StaffLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, logout, isAuthenticated, moderator } = useAuth();
  const navigate = useNavigate();

  // Always logout when landing on this page for a fresh start
  useEffect(() => {
    const ensureFreshStart = async () => {
      if (isAuthenticated) {
        await logout();
      }
    };
    ensureFreshStart();
  }, []); // Only run once when component mounts

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

  const inner = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    width: 100%;
    max-width: 400px;
  `;

  const title = css`
    font-size: clamp(1.5rem, 6vw, 3rem);
    text-align: center;
    font-family: 'Lilita One', cursive;
    color: #a47148;
  `;

  const form = css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 300px;
  `;

  const pill = css`
    width: 100%;
    border-radius: 1.5rem;
    background-color: #eacdca;
    height: 3rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const input = css`
    width: calc(100% - 40px);
    height: 100%;
    border: none;
    background: transparent;
    font-family: Poppins, sans-serif;
    font-size: 1.125rem;
    text-align: center;
    outline: none;
    padding: 0;
    margin: 0;
    line-height: 3rem;
    
    &::placeholder {
      text-align: center;
      color: #8b7355;
      line-height: 3rem;
    }
  `;

  const button = css`
    background-color: #d67b7b;
    color: white;
    border: none;
    border-radius: 1.5rem;
    padding: 0.75rem 1.5rem;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #c56c6c;
    }
    
    &:disabled {
      background-color: #d3a7a7;
      cursor: not-allowed;
    }
  `;

  const errorText = css`
    color: #d67b7b;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    text-align: center;
  `;

  const link = css`
    color: #a47148;
    font-family: Poppins, sans-serif;
    text-decoration: none;
    margin-top: 1rem;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  `;

  const note = css`
    color: #8b7355;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    text-align: center;
    font-style: italic;
    margin-top: 1rem;
  `;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    try {
      setIsLoggingIn(true);
      console.log('Attempting login with username:', username);
      
      const success = await login(username, password);
      
      if (success) {
        console.log('Login successful');
        // Navigate based on user role
        if (moderator?.isAdmin) {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/mod-dashboard', { replace: true });
        }
      } else {
        setError('Invalid username or password');
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed: ' + error.message);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={container}>
      <div className={inner}>
        <div className={title}>Staff Login</div>
        
        <form className={form} onSubmit={handleLogin}>
          <div className={pill}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={input}
              disabled={isLoggingIn}
              autoFocus
            />
          </div>
          
          <div className={pill}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              disabled={isLoggingIn}
            />
          </div>
          
          {error && <div className={errorText}>{error}</div>}
          
          <button
            type="submit"
            className={button}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className={note}>
          Enter your admin or moderator credentials
        </div>
        
        <div className={link} onClick={() => navigate('/')}>
          Back to Home
        </div>
      </div>
    </div>
  );
}