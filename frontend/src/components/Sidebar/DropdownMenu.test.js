// Test file to verify the dropdown menu functionality
// This file can be used to verify that the dropdown menu works correctly

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './components/Sidebar/Sidebar';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

describe('Dropdown Menu Bottom Navigation', () => {
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
    setShowBottomNav: jest.fn(),
    showDropdownMenu: false,
    setShowDropdownMenu: jest.fn()
  };

  test('renders dropdown menu button above navigation', () => {
    render(<Sidebar {...defaultProps} />);
    
    // Check if dropdown menu button is present
    const dropdownButton = screen.getByTitle('Menu options');
    expect(dropdownButton).toBeInTheDocument();
    
    // Check that the button contains the menu icon
    const menuIcon = dropdownButton.querySelector('svg');
    expect(menuIcon).toBeInTheDocument();
  });

  test('toggles dropdown menu when button is clicked', () => {
    const setShowDropdownMenuMock = jest.fn();
    render(<Sidebar {...defaultProps} setShowDropdownMenu={setShowDropdownMenuMock} />);
    
    const dropdownButton = screen.getByTitle('Menu options');
    fireEvent.click(dropdownButton);
    
    expect(setShowDropdownMenuMock).toHaveBeenCalledWith(true);
  });

  test('renders dropdown menu items when menu is open', () => {
    render(<Sidebar {...defaultProps} showDropdownMenu={true} />);
    
    // Check if dropdown menu is present
    const dropdownMenu = screen.getByRole('button', { name: 'Hide Navigation' });
    expect(dropdownMenu).toBeInTheDocument();
    
    // Check if menu items are present
    const hideNavItem = screen.getByText('Hide Navigation');
    expect(hideNavItem).toBeInTheDocument();
    
    const settingsItem = screen.getByText('Settings');
    expect(settingsItem).toBeInTheDocument();
  });

  test('hides navigation when "Hide Navigation" is clicked', () => {
    const setShowBottomNavMock = jest.fn();
    const setShowDropdownMenuMock = jest.fn();
    render(<Sidebar {...defaultProps} 
      setShowBottomNav={setShowBottomNavMock} 
      setShowDropdownMenu={setShowDropdownMenuMock}
      showDropdownMenu={true} />);
    
    const hideNavButton = screen.getByText('Hide Navigation');
    fireEvent.click(hideNavButton);
    
    expect(setShowBottomNavMock).toHaveBeenCalledWith(false);
    expect(setShowDropdownMenuMock).toHaveBeenCalledWith(false);
  });
});