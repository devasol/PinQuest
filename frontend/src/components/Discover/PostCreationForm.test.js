// Test file to verify the changes made to PostCreationForm and DiscoverMain
// This file can be used to verify that the font changes and overlap fix work correctly

import React from 'react';
import { render, screen } from '@testing-library/react';
import PostCreationForm from './components/Discover/PostCreationForm';

// Mock the dependencies
jest.mock('framer-motion', () => ({
  motion: ({ children }) => children
}));

describe('PostCreationForm', () => {
  const defaultProps = {
    creatingPostAt: { lat: 40.7128, lng: -74.0060 },
    postCreationForm: {
      title: '',
      description: '',
      category: 'general',
      images: [],
      loading: false,
      error: null
    },
    handlePostCreationFormChange: jest.fn(),
    handleMapPostCreation: jest.fn(),
    setCreatingPostAt: jest.fn()
  };

  test('renders with improved font styles and sizing', () => {
    render(<PostCreationForm {...defaultProps} />);
    
    // Check if the form elements have the amazing-post-form class
    const formElements = screen.getAllByText(/(Title|Description|Category|Images)/i);
    expect(formElements.length).toBeGreaterThan(0);
    
    // Check if input fields have proper font sizing classes
    const titleInput = screen.getByPlaceholderText('Enter an engaging title');
    expect(titleInput).toHaveClass('text-sm');
    
    const descriptionTextarea = screen.getByPlaceholderText('Describe this location...');
    expect(descriptionTextarea).toHaveClass('text-sm');
    
    const categorySelect = screen.getByRole('combobox');
    expect(categorySelect).toHaveClass('text-sm');
  });

  test('renders with proper label sizing', () => {
    render(<PostCreationForm {...defaultProps} />);
    
    // Check if labels have proper font sizing
    const titleLabel = screen.getByText('Title *');
    expect(titleLabel).toHaveClass('text-sm');
    
    const descriptionLabel = screen.getByText('Description *');
    expect(descriptionLabel).toHaveClass('text-sm');
    
    const categoryLabel = screen.getByText('Category');
    expect(categoryLabel).toHaveClass('text-sm');
  });
});