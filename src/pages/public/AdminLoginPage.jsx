// src/pages/public/AdminLoginPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { adminLogin, isAuthenticated, moderator, loading } = useAuth();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  // Only redirect once when conditions are met
  useEffect(() => {
    if (!loading && isAuthenticated && moderator?.isAdmin && !hasNavigated.current && !isNavigating) {
      hasNavigated.current = true;
      setIsNavigating(true);
      navigate('/admin-dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, moderator, navigate, isNavigating]);

  // Styling
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
    gap: 2.5rem;
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
    padding: 0.5rem 1rem;
    box-sizing: border-box;
  `;

  const input = css`
    width: 100%;
    border: none;
    background: transparent;
    font-family: Poppins, sans-serif;
    font-size: 1.125rem;
    text-align: center;
    outline: none;
    padding: 0.5rem 0;
    color: #4b3b2b;
    
    &::placeholder {
      text-align: center;
      color: #8b7355;
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
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
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  `;

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter admin password');
      return;
    }

    try {
      setIsLoggingIn(true);
      setError('');
      
      const success = await adminLogin(password);
      
      if (success) {
        // Set navigating state to prevent multiple navigations
        setIsNavigating(true);
        // Navigation will be handled by useEffect
      } else {
        setError('Invalid admin password');
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      setIsLoggingIn(false);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (error) setError('');
  };

  // Show loading or navigating state
  if (loading || isNavigating) {
    return (
      <div className={container}>
        <div style={{ textAlign: 'center', color: '#a47148', fontFamily: 'Poppins, sans-serif' }}>
          {isNavigating ? 'Redirecting to dashboard...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className={container}>
      <div className={inner}>
        <div className={title}>Admin Login</div>
        
        <form className={form} onSubmit={handleLogin}>
          <div className={pill}>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={handlePasswordChange}
              className={input}
              disabled={isLoggingIn}
              autoFocus
              autoComplete="current-password"
            />
          </div>
          
          {error && <div className={errorText}>{error}</div>}
          
          <button
            type="submit"
            className={button}
            disabled={isLoggingIn || !password.trim()}
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center' }}>
          <div className={link} onClick={() => navigate('/mod-login')}>
            Moderator Login
          </div>
          <div className={link} onClick={() => navigate('/')} style={{ marginTop: '0.5rem' }}>
            Back to Home
          </div>
        </div>
      </div>
    </div>
  );
}