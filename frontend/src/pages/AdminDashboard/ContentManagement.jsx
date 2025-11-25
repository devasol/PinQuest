import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter, Calendar, MapPin, Tag, MessageSquare, AlertTriangle } from 'lucide-react';
import usePageTitle from '../../services/usePageTitle';
import './ContentManagement.css';

const ContentManagement = () => {
  usePageTitle("Content Management");
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Determine API URL with fallback
        let apiUrl = import.meta.env.VITE_API_BASE_URL;
        if (!apiUrl) {
          apiUrl = 'http://localhost:5000/api/v1';
        }
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`${apiUrl}/posts`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        
        if (data.status === 'success') {
          // Format post data to match our frontend structure
          const formattedPosts = data.data.map((post, index) => ({
            id: post._id,
            title: post.title,
            description: post.description,
            category: post.category || 'general',
            status: 'published', // All posts from the API are published unless we have a specific field
            author: post.postedBy?.name || 'Unknown', // Use the user's name if available
            date: post.datePosted,
            views: 0, // Assuming we don't have view tracking yet in the schema
            likes: post.likesCount || 0,
            comments: post.comments?.length || 0
          }));
          
          setPosts(formattedPosts);
          setFilteredPosts(formattedPosts);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter posts based on search term and selected filters
  useEffect(() => {
    let filtered = posts;

    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(post => post.status === selectedStatus);
    }

    setFilteredPosts(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, posts]);

  // Pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          alert('No authentication token found');
          return;
        }
        
        const response = await fetch(`${apiUrl}/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setPosts(posts.filter(post => post.id !== postId));
        } else {
          throw new Error('Failed to delete post');
        }
      } catch (err) {
        alert('Error deleting post: ' + err.message);
      }
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      // For now, we'll just update the local state
      // In a real implementation, you'd call an API endpoint to approve the post
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, status: 'published' }
          : post
      ));
      alert('Post approved successfully!');
    } catch (err) {
      alert('Error approving post: ' + err.message);
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      // For now, we'll just update the local state
      // In a real implementation, you'd call an API endpoint to reject the post
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, status: 'rejected' }
          : post
      ));
      alert('Post rejected successfully!');
    } catch (err) {
      alert('Error rejecting post: ' + err.message);
    }
  };

  const handleUpdatePost = async (postId, updatedPost) => {
    try {
      // Determine API URL with fallback
      let apiUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiUrl) {
        apiUrl = 'http://localhost:5000/api/v1';
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('No authentication token found');
        return;
      }
      
      const response = await fetch(`${apiUrl}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPost)
      });

      if (response.ok) {
        const updatedData = await response.json();
        // Update the post in the local state
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...updatedData.data, id: postId }
            : post
        ));
      } else {
        throw new Error('Failed to update post');
      }
    } catch (err) {
      alert('Error updating post: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'nature': return 'text-green-600 bg-green-100';
      case 'food': return 'text-orange-600 bg-orange-100';
      case 'culture': return 'text-purple-600 bg-purple-100';
      case 'shopping': return 'text-pink-600 bg-pink-100';
      case 'event': return 'text-blue-600 bg-blue-100';
      case 'general': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="content-management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-red-600 mb-2">Error loading posts</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-management">
      <div className="content-management-header">
        <h2 className="content-management-title">Content Management</h2>
        <div className="content-management-actions">
          <a href="/add-post" className="content-management-btn content-management-btn-primary">
            <Plus className="content-management-btn-icon" />
            Add Post
          </a>
          <button className="content-management-btn content-management-btn-secondary">
            <Filter className="content-management-btn-icon" />
            Filter
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="content-management-controls">
        <div className="content-management-search">
          <Search className="content-management-search-icon" />
          <input
            type="text"
            placeholder="Search posts by title, description, or author..."
            className="content-management-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="content-management-filters">
          <select 
            className="content-management-select" 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="nature">Nature</option>
            <option value="food">Food & Drinks</option>
            <option value="culture">Culture</option>
            <option value="shopping">Shopping</option>
            <option value="event">Event</option>
            <option value="general">General</option>
          </select>
          
          <select 
            className="content-management-select" 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="content-management-table-container">
        <table className="content-management-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Author</th>
              <th>Category</th>
              <th>Status</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPosts.map((post) => (
              <tr key={post.id} className="content-management-table-row">
                <td>
                  <div className="content-management-post-info">
                    <div className="content-management-post-title">{post.title}</div>
                    <div className="content-management-post-desc">{post.description}</div>
                  </div>
                </td>
                <td>{post.author}</td>
                <td>
                  <span className={`content-management-badge ${getCategoryColor(post.category)}`}>
                    {post.category}
                  </span>
                </td>
                <td>
                  <span className={`content-management-badge ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                </td>
                <td>{post.views}</td>
                <td>{post.likes}</td>
                <td>{post.comments}</td>
                <td>{formatDate(post.date)}</td>
                <td>
                  <div className="content-management-actions-cell">
                    <a href={`/discover/${post.id}`} target="_blank" className="content-management-action-btn content-management-action-view">
                      <Eye className="content-management-action-icon" />
                    </a>
                    <button className="content-management-action-btn content-management-action-edit">
                      <Edit className="content-management-action-icon" />
                    </button>
                    <button 
                      className="content-management-action-btn content-management-action-delete"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="content-management-action-icon" />
                    </button>
                    {post.status === 'pending' && (
                      <>
                        <button 
                          className="content-management-action-btn content-management-action-approve"
                          onClick={() => handleApprovePost(post.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="content-management-action-btn content-management-action-reject"
                          onClick={() => handleRejectPost(post.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPosts.length === 0 && (
          <div className="content-management-empty">
            <p>No posts found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="content-management-pagination">
          <button
            className="content-management-pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`content-management-pagination-btn ${currentPage === page ? 'content-management-pagination-btn-active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          
          <button
            className="content-management-pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;