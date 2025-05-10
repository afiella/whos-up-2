// src/components/ui/AdminBadge.jsx
import React from 'react';
import { css } from '@emotion/css';

export default function AdminBadge() {
  const badge = css`
    display: inline-block;
    background: linear-gradient(135deg, #ff6b9d 0%, #ffc0cb 100%);
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    margin-left: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    &::before {
      content: '♡';
      margin-right: 0.25rem;
      font-size: 0.75rem;
    }
  `;

  return <span className={badge}>Admin</span>;
}