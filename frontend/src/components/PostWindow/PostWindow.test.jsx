import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostWindow from './PostWindow';
import usePostInteractions from '../../hooks/usePostInteractions';
import { formatDate } from '../../utils/imageUtils';

// Mock the usePostInteractions hook
jest.mock('../../hooks/usePostInteractions');
// Mock imageUtils
jest.mock('../../utils/imageUtils', () => ({
  formatDate: jest.fn((dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }),
}));

describe('PostWindow', () => {
  const mockPost = {
    _id: 'post123',
    title: 'Beautiful Landscape',
    description: 'A stunning view from the mountains.',
    images: ['image1.jpg', 'image2.jpg'],
    postedBy: { _id: 'user1', name: 'John Doe' },
    datePosted: '2023-01-15T10:00:00.000Z',
    location: { latitude: 10, longitude: 20 },
    category: 'nature',
    comments: [
      {
        _id: 'comment1',
        user: { _id: 'user2', name: 'Jane Smith' },
        text: 'Amazing photo!',
        createdAt: '2023-01-15T11:00:00.000Z',
      },
      {
        _id: 'comment2',
        user: { _id: 'user3', name: 'Peter Jones' },
        text: 'Wish I was there.',
        createdAt: '2023-01-15T12:00:00.000Z',
      },
    ],
    averageRating: 4.5,
    totalRatings: 10,
    likesCount: 5,
  };

  const mockCurrentUser = { _id: 'user1', name: 'John Doe' };
  const mockAuthToken = 'mock-token';

  beforeEach(() => {
    usePostInteractions.mockReturnValue({
      liked: false,
      likeCount: 5,
      bookmarked: false,
      handleLike: jest.fn(),
      handleBookmark: jest.fn(),
      refreshPostStatus: jest.fn(),
    });
    // Reset mock calls for formatDate before each test
    formatDate.mockClear();
    formatDate.mockImplementation((dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      });
  });

  it('renders without crashing when closed', () => {
    const { container } = render(<PostWindow isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders post details when open', () => {
    render(
      <PostWindow 
        post={mockPost} 
        currentUser={mockCurrentUser} 
        authToken={mockAuthToken} 
        isAuthenticated={true} 
        isOpen={true} 
        onClose={jest.fn()} 
      />
    );

    expect(screen.getByText('Beautiful Landscape')).toBeInTheDocument();
    expect(screen.getByText('A stunning view from the mountains.')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Posted by user name
    expect(screen.getByText(/Jan 15, 2023, \d{2}:\d{2} (A|P)M/)).toBeInTheDocument(); // Formatted post date
  });

  it('displays comments with user names and formatted dates', async () => {
    render(
      <PostWindow 
        post={mockPost} 
        currentUser={mockCurrentUser} 
        authToken={mockAuthToken} 
        isAuthenticated={true} 
        isOpen={true} 
        onClose={jest.fn()} 
      />
    );

    // Open comments modal
    screen.getByRole('button', { name: /comments/i }).click();

    await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    // Check first comment
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Amazing photo!')).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2023, 11:00 AM/)).toBeInTheDocument(); // Formatted comment date

    // Check second comment
    expect(screen.getByText('Peter Jones')).toBeInTheDocument();
    expect(screen.getByText('Wish I was there.')).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2023, 12:00 PM/)).toBeInTheDocument(); // Formatted comment date
    
    // Ensure formatDate was called for both comments
    expect(formatDate).toHaveBeenCalledTimes(3); // Once for post.datePosted, twice for comments.createdAt
    expect(formatDate).toHaveBeenCalledWith('2023-01-15T10:00:00.000Z');
    expect(formatDate).toHaveBeenCalledWith('2023-01-15T11:00:00.000Z');
    expect(formatDate).toHaveBeenCalledWith('2023-01-15T12:00:00.000Z');
  });

  it('shows "No comments yet" when there are no comments', async () => {
    const postWithoutComments = { ...mockPost, comments: [] };
    render(
      <PostWindow 
        post={postWithoutComments} 
        currentUser={mockCurrentUser} 
        authToken={mockAuthToken} 
        isAuthenticated={true} 
        isOpen={true} 
        onClose={jest.fn()} 
      />
    );

    // Open comments modal
    screen.getByRole('button', { name: /comments/i }).click();

    await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument();
    });
    
    expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('calls handleLike when the like button is clicked', () => {
    const handleLikeMock = jest.fn();
    usePostInteractions.mockReturnValue({
      liked: false,
      likeCount: 5,
      bookmarked: false,
      handleLike: handleLikeMock,
      handleBookmark: jest.fn(),
    });

    render(
      <PostWindow
        post={mockPost}
        currentUser={mockCurrentUser}
        authToken={mockAuthToken}
        isAuthenticated={true}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    const likeButton = screen.getByText('5').closest('button');
    fireEvent.click(likeButton);

    expect(handleLikeMock).toHaveBeenCalledTimes(1);
  });
});
