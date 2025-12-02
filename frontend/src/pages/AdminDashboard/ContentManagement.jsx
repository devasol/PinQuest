import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter, Calendar, MapPin, Tag, MessageSquare, AlertTriangle } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import usePageTitle from '../../services/usePageTitle';
import { adminAPI } from '../../services/api';
import './ContentManagement.css';

const ContentManagement = () => {
  usePageTitle("Content Management");
  const { showModal } = useModal();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showPostDetailsModal, setShowPostDetailsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState({
    id: '',
    title: '',
    description: '',
    category: 'general'
  });

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getPosts();
        
        if (data.status === 'success') {
          // Format post data to match our frontend structure
          const formattedPosts = data.data.map((post) => ({
            id: post._id,
            title: post.title || 'Untitled Post',
            description: post.description || 'No description',
            category: post.category || 'general',
            status: post.status || 'published', // Use the post's actual status from the backend
            author: post.postedBy?.name || post.postedBy?.email || 'Unknown', // Use the user's name if available
            date: post.datePosted || new Date().toISOString(),
            views: 0, // Assuming we don't have view tracking yet in the schema
            likes: post.likesCount || (post.likes ? post.likes.length : 0),
            comments: Array.isArray(post.comments) ? post.comments.length : 0
          }));
          
          setPosts(formattedPosts);
          setFilteredPosts(formattedPosts);
        } else {
          throw new Error(data.message || 'Failed to fetch posts');
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
        await adminAPI.deletePost(postId);
        setPosts(posts.filter(post => post.id !== postId));
        setFilteredPosts(filteredPosts.filter(post => post.id !== postId));
      } catch (err) {
        alert('Error deleting post: ' + err.message);
      }
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      await adminAPI.approvePost(postId);
      
      // Update the post in local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, status: 'published' }
          : post
      ));
      setFilteredPosts(filteredPosts.map(post => 
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
      await adminAPI.rejectPost(postId);
      
      // Update the post in local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, status: 'rejected' }
          : post
      ));
      setFilteredPosts(filteredPosts.map(post => 
        post.id === postId 
          ? { ...post, status: 'rejected' }
          : post
      ));
      
      alert('Post rejected successfully!');
    } catch (err) {
      alert('Error rejecting post: ' + err.message);
    }
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowPostDetailsModal(true);
  };

  const handleUpdatePost = async (postId, updatedPost) => {
    try {
      // Use the admin API to update the post
      await adminAPI.updatePost(postId, updatedPost);
      
      // Update the post in the local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, ...updatedPost }
          : post
      ));
      setFilteredPosts(filteredPosts.map(post => 
        post.id === postId 
          ? { ...post, ...updatedPost }
          : post
      ));
    } catch (err) {
      alert('Error updating post: ' + err.message);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost({
      id: post.id,
      title: post.title,
      description: post.description,
      category: post.category
    });
    setShowEditPostModal(true);
  };

  const handleEditPostSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updatePost(editingPost.id, {
        title: editingPost.title,
        description: editingPost.description,
        category: editingPost.category
      });
      
      // Update the posts in state
      setPosts(posts.map(post => 
        post.id === editingPost.id 
          ? { ...post, title: editingPost.title, description: editingPost.description, category: editingPost.category }
          : post
      ));
      setFilteredPosts(filteredPosts.map(post => 
        post.id === editingPost.id 
          ? { ...post, title: editingPost.title, description: editingPost.description, category: editingPost.category }
          : post
      ));
      
      setShowEditPostModal(false);
      alert('Post updated successfully!');
    } catch (err) {
      alert('Error updating post: ' + err.message);
    }
  };

  const handleEditPostChange = (e) => {
    setEditingPost({
      ...editingPost,
      [e.target.name]: e.target.value
    });
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
          <button className="content-management-btn content-management-btn-secondary" onClick={() => setShowFilterPanel(!showFilterPanel)}>
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

      {/* Advanced Filter Panel */}
      {showFilterPanel && (
        <div className="content-management-advanced-filter">
          <div className="content-management-advanced-filter-content">
            <h4>Advanced Filters</h4>
            <div className="content-management-advanced-filter-fields">
              <div className="content-management-advanced-filter-field">
                <label>Keyword Search</label>
                <input
                  type="text"
                  placeholder="Search in title, description, or author..."
                  className="content-management-form-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="content-management-advanced-filter-field">
                <label>Category</label>
                <select 
                  className="content-management-form-select" 
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
              </div>
              <div className="content-management-advanced-filter-field">
                <label>Status</label>
                <select 
                  className="content-management-form-select" 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="content-management-advanced-filter-field">
                <label>Date Range</label>
                <div className="content-management-date-range">
                  <input
                    type="date"
                    placeholder="Start date"
                    className="content-management-form-input"
                    onChange={(e) => console.log("Start date:", e.target.value)} // Placeholder for functionality
                  />
                  <span className="content-management-date-separator">to</span>
                  <input
                    type="date"
                    placeholder="End date"
                    className="content-management-form-input"
                    onChange={(e) => console.log("End date:", e.target.value)} // Placeholder for functionality
                  />
                </div>
              </div>
            </div>
            <div className="content-management-advanced-filter-actions">
              <button 
                className="content-management-btn content-management-btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
              >
                Clear Filters
              </button>
              <button 
                className="content-management-btn content-management-btn-primary"
                onClick={() => setShowFilterPanel(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <button className="content-management-action-btn content-management-action-view" onClick={() => handleViewPost(post)}>
                      <Eye className="content-management-action-icon" />
                    </button>
                    <button className="content-management-action-btn content-management-action-edit" onClick={() => handleEditPost(post)}>
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

      {/* Edit Post Modal */}
      {showEditPostModal && (
        <div className="content-management-modal-overlay" onClick={() => setShowEditPostModal(false)}>
          <div className="content-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="content-management-modal-header">
              <h3>Edit Post</h3>
              <button className="content-management-modal-close" onClick={() => setShowEditPostModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleEditPostSubmit} className="content-management-modal-form">
              <div className="content-management-form-group">
                <label htmlFor="edit-title">Title</label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={editingPost.title}
                  onChange={handleEditPostChange}
                  required
                  className="content-management-form-input"
                />
              </div>
              <div className="content-management-form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editingPost.description}
                  onChange={handleEditPostChange}
                  required
                  className="content-management-form-textarea"
                  rows="4"
                />
              </div>
              <div className="content-management-form-group">
                <label htmlFor="edit-category">Category</label>
                <select
                  id="edit-category"
                  name="category"
                  value={editingPost.category}
                  onChange={handleEditPostChange}
                  className="content-management-form-select"
                >
                  <option value="nature">Nature</option>
                  <option value="food">Food & Drinks</option>
                  <option value="culture">Culture</option>
                  <option value="shopping">Shopping</option>
                  <option value="event">Event</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="content-management-modal-actions">
                <button type="button" className="content-management-btn content-management-btn-secondary" onClick={() => setShowEditPostModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="content-management-btn content-management-btn-primary">
                  Update Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Details Modal */}
      {showPostDetailsModal && selectedPost && (
        <div className="content-management-modal-overlay" onClick={() => setShowPostDetailsModal(false)}>
          <div className="content-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="content-management-modal-header">
              <h3>Post Details</h3>
              <button className="content-management-modal-close" onClick={() => setShowPostDetailsModal(false)}>
                &times;
              </button>
            </div>
            <div className="content-management-modal-content">
              <div className="content-management-detail-item">
                <strong>ID:</strong> {selectedPost.id}
              </div>
              <div className="content-management-detail-item">
                <strong>Title:</strong> {selectedPost.title}
              </div>
              <div className="content-management-detail-item">
                <strong>Description:</strong> <div className="content-management-detail-description">{selectedPost.description}</div>
              </div>
              <div className="content-management-detail-item">
                <strong>Author:</strong> {selectedPost.author}
              </div>
              <div className="content-management-detail-item">
                <strong>Category:</strong> 
                <span className={`content-management-badge ${getCategoryColor(selectedPost.category)}`}>
                  {selectedPost.category}
                </span>
              </div>
              <div className="content-management-detail-item">
                <strong>Status:</strong> 
                <span className={`content-management-badge ${getStatusColor(selectedPost.status)}`}>
                  {selectedPost.status}
                </span>
              </div>
              <div className="content-management-detail-item">
                <strong>Views:</strong> {selectedPost.views}
              </div>
              <div className="content-management-detail-item">
                <strong>Likes:</strong> {selectedPost.likes}
              </div>
              <div className="content-management-detail-item">
                <strong>Comments:</strong> {selectedPost.comments}
              </div>
              <div className="content-management-detail-item">
                <strong>Date Posted:</strong> {formatDate(selectedPost.date)}
              </div>
            </div>
            <div className="content-management-modal-actions">
              <button 
                className="content-management-btn content-management-btn-secondary" 
                onClick={() => setShowPostDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;