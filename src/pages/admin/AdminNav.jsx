// src/components/admin/AdminNav.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { css } from '@emotion/css';

export default function AdminNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navLinks = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/players', label: 'Player Management', icon: '👥' },
    { path: '/admin/history', label: 'History', icon: '📚' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
  ];
  
  const nav = css`
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
    padding: 0.5rem;
    background-color: white;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    flex-wrap: wrap;
  `;
  
  const navItem = css`
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    text-decoration: none;
    font-family: Poppins, sans-serif;
    color: #4b3b2b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    
    &:hover {
      background-color: #f6dfdf;
    }
    
    &.active {
      background-color: #d67b7b;
      color: white;
    }
  `;
  
  return (
    <nav className={nav}>
      {navLinks.map(link => (
        <Link
          key={link.path}
          to={link.path}
          className={`${navItem} ${currentPath === link.path ? 'active' : ''}`}
        >
          <span role="img" aria-label={link.label}>{link.icon}</span>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}