import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, Filter, Download, Eye, AlertTriangle } from 'lucide-react';
import usePageTitle from '../../services/usePageTitle';
import { adminAPI } from '../../services/api';
import './UserManagement.css';

const UserManagement = () => {
  usePageTitle("User Management");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getUsers();
        
        if (data.status === 'success') {
          // Format user data to match our frontend structure
          const formattedUsers = data.data.map((user) => ({
            id: user._id,
            name: user.name || 'Unknown User',
            email: user.email || 'No Email',
            role: user.role || 'user', // Default to 'user' if role is not specified
            status: user.isVerified ? 'active' : 'inactive', // Use verification status as active status
            joinDate: user.createdAt || user.datePosted || new Date().toISOString(),
            posts: user.postsCount || 0, // Assuming there's a way to get post count
            lastActive: user.updatedAt || user.createdAt || new Date().toISOString()
          }));
          
          setUsers(formattedUsers);
          setFilteredUsers(formattedUsers);
        } else {
          throw new Error(data.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term and selected filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedStatus, users]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
      } catch (err) {
        alert('Error deleting user: ' + err.message);
      }
    }
  };

  const handleBanUser = async (userId) => {
    try {
      // For now, we'll use a placeholder API call
      // In a real implementation, you'd have an endpoint to ban/unban users
      alert('This would ban/unban the user in a real implementation');
    } catch (err) {
      alert('Error updating user status: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'banned': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100';
      case 'moderator': return 'text-blue-600 bg-blue-100';
      case 'user': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-red-600 mb-2">Error loading users</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2 className="user-management-title">User Management</h2>
        <div className="user-management-actions">
          <button className="user-management-btn user-management-btn-primary">
            <UserPlus className="user-management-btn-icon" />
            Add User
          </button>
          <button className="user-management-btn user-management-btn-secondary">
            <Download className="user-management-btn-icon" />
            Export
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="user-management-controls">
        <div className="user-management-search">
          <Search className="user-management-search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="user-management-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="user-management-filters">
          <select 
            className="user-management-select" 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
          </select>
          
          <select 
            className="user-management-select" 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="user-management-table-container">
        <table className="user-management-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Posts</th>
              <th>Join Date</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} className="user-management-table-row">
                <td>
                  <div className="user-management-user-info">
                    <div className="user-management-user-avatar">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="user-management-user-name">{user.name}</div>
                      <div className="user-management-user-id">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`user-management-badge ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`user-management-badge ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.posts}</td>
                <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                <td>{new Date(user.lastActive).toLocaleDateString()}</td>
                <td>
                  <div className="user-management-actions-cell">
                    <button className="user-management-action-btn user-management-action-view">
                      <Eye className="user-management-action-icon" />
                    </button>
                    <button className="user-management-action-btn user-management-action-edit">
                      <Edit className="user-management-action-icon" />
                    </button>
                    <button 
                      className="user-management-action-btn user-management-action-delete"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="user-management-action-icon" />
                    </button>
                    <button 
                      className={`user-management-action-btn ${user.status === 'banned' ? 'user-management-action-unban' : 'user-management-action-ban'}`}
                      onClick={() => handleBanUser(user.id)}
                    >
                      {user.status === 'banned' ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="user-management-empty">
            <p>No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="user-management-pagination">
          <button
            className="user-management-pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`user-management-pagination-btn ${currentPage === page ? 'user-management-pagination-btn-active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          
          <button
            className="user-management-pagination-btn"
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

export default UserManagement;