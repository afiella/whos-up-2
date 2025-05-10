// src/components/ui/ModeratorBadge.jsx
import React from 'react';
import { css } from '@emotion/css';

export default function ModeratorBadge() {
  const badge = css`
    display: inline-block;
    background-color: #a47148;
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    margin-left: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `;

  return <span className={badge}>Mod</span>;
}