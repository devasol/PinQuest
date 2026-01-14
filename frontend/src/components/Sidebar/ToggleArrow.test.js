// Test file to verify the toggle arrow functionality
// This file can be used to verify that the toggle functionality works correctly

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './components/Sidebar/Sidebar';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

describe('Toggle Arrow Bottom Navigation', () => {
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

  test('renders toggle arrow button in top-right corner', () => {
    render(<Sidebar {...defaultProps} />);
    
    // Check if toggle arrow button is present
    const toggleButton = screen.getByTitle('Hide navigation');
    expect(toggleButton).toBeInTheDocument();
    
    // Check that the button contains the up arrow icon
    const upArrowIcon = toggleButton.querySelector('svg');
    expect(upArrowIcon).toBeInTheDocument();
  });

  test('toggles navigation visibility when arrow button is clicked', () => {
    const setShowBottomNavMock = jest.fn();
    render(<Sidebar {...defaultProps} setShowBottomNav={setShowBottomNavMock} />);
    
    const toggleButton = screen.getByTitle('Hide navigation');
    fireEvent.click(toggleButton);
    
    expect(setShowBottomNavMock).toHaveBeenCalledWith(false);
  });

  test('shows down arrow when navigation is hidden', () => {
    // This test would require checking the state when navigation is hidden
    // which is more complex to test in isolation
    render(<Sidebar {...defaultProps} showBottomNav={false} />);
    
    // Verify that the show button is present when navigation is hidden
    const showButton = screen.getByTitle('Show navigation');
    expect(showButton).toBeInTheDocument();
  });

  test('shows navigation when down arrow is clicked', () => {
    const setShowBottomNavMock = jest.fn();
    render(<Sidebar {...defaultProps} showBottomNav={false} setShowBottomNav={setShowBottomNavMock} />);
    
    const showButton = screen.getByTitle('Show navigation');
    fireEvent.click(showButton);
    
    expect(setShowBottomNavMock).toHaveBeenCalledWith(true);
  });
});