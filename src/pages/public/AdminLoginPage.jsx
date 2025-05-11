// src/pages/public/AdminLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

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

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter password');
      return;
    }

    const success = adminLogin(password);
    
    if (success) {
      navigate('/admin-dashboard');
    } else {
      setError('Invalid password');
    }
  };

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
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              autoFocus
            />
          </div>
          
          {error && <div className={errorText}>{error}</div>}
          
          <button type="submit" className={button}>
            Login
          </button>
        </form>
        
        <div className={link} onClick={() => navigate('/')}>
          Back to Home
        </div>
      </div>
    </div>
  );
}