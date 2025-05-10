// src/components/ui/ModeratorBadge.jsx
import React from 'react';
import { css } from '@emotion/css';

export default function ModeratorBadge({ small = false, isAdmin = false }) {
  const badge = css`
    display: inline-block;
    background-color: ${isAdmin ? '#d67b7b' : '#a47148'};
    color: white;
    font-family: Poppins, sans-serif;
    font-size: ${small ? '0.5rem' : '0.625rem'};
    padding: ${small ? '0.1rem 0.4rem' : '0.125rem 0.5rem'};
    border-radius: 1rem;
    margin-left: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `;

  return <span className={badge}>{isAdmin ? 'Admin' : 'Mod'}</span>;
}