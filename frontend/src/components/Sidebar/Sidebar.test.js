// Test file to verify the bottom navigation minimize/maximize functionality
// This file can be used to verify that the toggle functionality works correctly

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './components/Sidebar/Sidebar';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

describe('Sidebar with Bottom Navigation Toggle', () => {
  const defaultProps = {
    onLogout: jest.fn(),
    user: null,
    toggleWindow: jest.fn(),
    showSavedLocationsOnMap: false,
    updateUserLocation: jest.fn(),
    followUser: false,
    locationLoading: false,
    setFollowUser: jest.fn(),
    isSidebarExpanded: false,
    toggleSidebar: jest.fn(),
    isMobile: true,
    mobileBottomNavActive: '',
    setMobileBottomNavActive: jest.fn(),
    showBottomNav: true,
    setShowBottomNav: jest.fn()
  };

  test('renders bottom navigation when showBottomNav is true', () => {
    render(<Sidebar {...defaultProps} showBottomNav={true} />);
    
    // Check if bottom navigation is visible
    const bottomNav = screen.queryByRole('button', { name: /Minimize/i });
    expect(bottomNav).toBeInTheDocument();
  });

  test('does not render bottom navigation when showBottomNav is false', () => {
    render(<Sidebar {...defaultProps} showBottomNav={false} />);
    
    // Check if bottom navigation is hidden
    const bottomNav = screen.queryByRole('button', { name: /Minimize/i });
    expect(bottomNav).not.toBeInTheDocument();
    
    // Check if show button is visible
    const showButton = screen.getByTitle('Show navigation');
    expect(showButton).toBeInTheDocument();
  });

  test('calls setShowBottomNav with false when minimize button is clicked', () => {
    const setShowBottomNavMock = jest.fn();
    render(<Sidebar {...defaultProps} setShowBottomNav={setShowBottomNavMock} />);
    
    const minimizeButton = screen.getByTitle('Minimize navigation');
    fireEvent.click(minimizeButton);
    
    expect(setShowBottomNavMock).toHaveBeenCalledWith(false);
  });

  test('calls setShowBottomNav with true when show button is clicked', () => {
    const setShowBottomNavMock = jest.fn();
    render(<Sidebar {...defaultProps} showBottomNav={false} setShowBottomNav={setShowBottomNavMock} />);
    
    const showButton = screen.getByTitle('Show navigation');
    fireEvent.click(showButton);
    
    expect(setShowBottomNavMock).toHaveBeenCalledWith(true);
  });
});