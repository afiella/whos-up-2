// src/components/ui/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';

export default function BackButton({ label = 'Back', className = '' }) {
  const navigate = useNavigate();
  
  const backButton = css`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #f6dfdf;
    color: #4b3b2b;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: #d67b7b;
      color: white;
    }
  `;
  
  return (
    <button 
      className={`${backButton} ${className}`}
      onClick={() => navigate(-1)} // This navigates back to the previous page
    >
      <span role="img" aria-label="Back">←</span> {label}
    </button>
  );
}