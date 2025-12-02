import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, Filter, Download, Eye, AlertTriangle } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import usePageTitle from '../../services/usePageTitle';
import { adminAPI } from '../../services/api';
import './UserManagement.css';

const UserManagement = () => {
  usePageTitle("User Management");
  const { showModal } = useModal();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [editingUser, setEditingUser] = useState({
    id: '',
    name: '',
    email: '',
    role: 'user'
  });

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
            status: user.isBanned ? 'banned' : 'active', // Use ban status to determine active/banned
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

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };



  const handleAddUserChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateRegularUser = async (e) => {
    e.preventDefault();
    try {
      // Use the admin API to create a user with the specified role
      await adminAPI.createUser(newUser);
      
      // Reset form and close modal
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      setShowAddUserModal(false);
      
      // Refresh user list
      const data = await adminAPI.getUsers();
      if (data.status === 'success') {
        const formattedUsers = data.data.map((user) => ({
          id: user._id,
          name: user.name || 'Unknown User',
          email: user.email || 'No Email',
          role: user.role || 'user',
          status: user.isBanned ? 'banned' : 'active',
          joinDate: user.createdAt || user.datePosted || new Date().toISOString(),
          posts: user.postsCount || 0,
          lastActive: user.updatedAt || user.createdAt || new Date().toISOString()
        }));
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      }
      
      showModal({
        title: "Success",
        message: 'User created successfully!',
        type: 'success',
        confirmText: 'OK'
      });
    } catch (err) {
      showModal({
        title: "Error",
        message: 'Error creating user: ' + err.message,
        type: 'error',
        confirmText: 'OK'
      });
    }
  };

  const handleExportUsers = () => {
    // Convert users data to CSV format
    const csvContent = convertUsersToCSV(filteredUsers);
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertUsersToCSV = (users) => {
    if (users.length === 0) return '';
    
    // Define CSV headers
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Join Date', 'Last Active', 'Posts Count'];
    const csvHeaders = headers.join(',');
    
    // Convert each user to a CSV row
    const csvRows = users.map(user => {
      const row = [
        `"${user.id}"`, 
        `"${user.name.replace(/"/g, '""')}"`, 
        `"${user.email.replace(/"/g, '""')}"`, 
        `"${user.role}"`, 
        `"${user.status}"`, 
        `"${new Date(user.joinDate).toLocaleDateString()}"`, 
        `"${new Date(user.lastActive).toLocaleDateString()}"`, 
        `"${user.posts}"`
      ];
      return row.join(',');
    });
    
    // Combine headers and rows
    return [csvHeaders, ...csvRows].join('\n');
  };

  const handleEditUser = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowEditUserModal(true);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update the user's role using the admin API
      await adminAPI.updateUserRole(editingUser.id, editingUser.role);
      
      // Reset form and close modal
      setShowEditUserModal(false);
      
      // Refresh user list
      const data = await adminAPI.getUsers();
      if (data.status === 'success') {
        const formattedUsers = data.data.map((user) => ({
          id: user._id,
          name: user.name || 'Unknown User',
          email: user.email || 'No Email',
          role: user.role || 'user',
          status: user.isBanned ? 'banned' : 'active',
          joinDate: user.createdAt || user.datePosted || new Date().toISOString(),
          posts: user.postsCount || 0,
          lastActive: user.updatedAt || user.createdAt || new Date().toISOString()
        }));
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      }
      
      showModal({
        title: "Success",
        message: 'User updated successfully!',
        type: 'success',
        confirmText: 'OK'
      });
    } catch (err) {
      showModal({
        title: "Error",
        message: 'Error updating user: ' + err.message,
        type: 'error',
        confirmText: 'OK'
      });
    }
  };

  const handleEditUserChange = (e) => {
    setEditingUser({
      ...editingUser,
      [e.target.name]: e.target.value
    });
  };

  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
      } catch (err) {
        showModal({
          title: "Error",
          message: 'Error deleting user: ' + err.message,
          type: 'error',
          confirmText: 'OK'
        });
      }
    }
  };

  const handleBanUser = async (userId) => {
    try {
      // Find the user to get current status
      const user = users.find(u => u.id === userId);
      if (!user) {
        showModal({
          title: "Error",
          message: 'User not found',
          type: 'error',
          confirmText: 'OK'
        });
        return;
      }
      
      // Determine new ban status based on current status
      const shouldBan = user.status !== 'banned';
      
      // Call the API to update user ban status
      await adminAPI.updateUserBanStatus(userId, shouldBan);
      
      // Update local state to reflect the change
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: shouldBan ? 'banned' : 'active' }
          : user
      ));
      
      setFilteredUsers(filteredUsers.map(user => 
        user.id === userId 
          ? { ...user, status: shouldBan ? 'banned' : 'active' }
          : user
      ));
      
      showModal({
        title: "Success",
        message: `User ${shouldBan ? 'banned' : 'unbanned'} successfully!`,
        type: 'success',
        confirmText: 'OK'
      });
    } catch (err) {
      showModal({
        title: "Error",
        message: 'Error updating user status: ' + err.message,
        type: 'error',
        confirmText: 'OK'
      });
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
          <button className="user-management-btn user-management-btn-primary" onClick={handleAddUser}>
            <UserPlus className="user-management-btn-icon" />
            Add User
          </button>
          <button className="user-management-btn user-management-btn-secondary" onClick={handleExportUsers}>
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
                    <button className="user-management-action-btn user-management-action-view" onClick={() => handleViewUser(user)} aria-label="View user">
                      <Eye className="user-management-action-icon" />
                    </button>
                    <button className="user-management-action-btn user-management-action-edit" onClick={() => handleEditUser(user)} aria-label="Edit user">
                      <Edit className="user-management-action-icon" />
                    </button>
                    <button 
                      className="user-management-action-btn user-management-action-delete"
                      onClick={() => handleDeleteUser(user.id)}
                      aria-label="Delete user"
                    >
                      <Trash2 className="user-management-action-icon" />
                    </button>
                    <button 
                      className={`user-management-action-btn ${user.status === 'banned' ? 'user-management-action-unban' : 'user-management-action-ban'}`}
                      onClick={() => handleBanUser(user.id)}
                      aria-label={user.status === 'banned' ? "Unban user" : "Ban user"}
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
            aria-label="Previous page"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`user-management-pagination-btn ${currentPage === page ? 'user-management-pagination-btn-active' : ''}`}
              onClick={() => handlePageChange(page)}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          ))}
          
          <button
            className="user-management-pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="user-management-modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="user-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-management-modal-header">
              <h3>Add New User</h3>
              <button className="user-management-modal-close" onClick={() => setShowAddUserModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateRegularUser} className="user-management-modal-form">
              <div className="user-management-form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleAddUserChange}
                  required
                  className="user-management-form-input"
                />
              </div>
              <div className="user-management-form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleAddUserChange}
                  required
                  className="user-management-form-input"
                />
              </div>
              <div className="user-management-form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleAddUserChange}
                  required
                  className="user-management-form-input"
                />
              </div>
              <div className="user-management-form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleAddUserChange}
                  className="user-management-form-select"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="user-management-modal-actions">
                <button type="button" className="user-management-btn user-management-btn-secondary" onClick={() => setShowAddUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="user-management-btn user-management-btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="user-management-modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="user-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-management-modal-header">
              <h3>Edit User</h3>
              <button className="user-management-modal-close" onClick={() => setShowEditUserModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleEditUserSubmit} className="user-management-modal-form">
              <div className="user-management-form-group">
                <label htmlFor="edit-name">Name</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editingUser.name}
                  onChange={handleEditUserChange}
                  required
                  className="user-management-form-input"
                  disabled
                />
              </div>
              <div className="user-management-form-group">
                <label htmlFor="edit-email">Email</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={editingUser.email}
                  onChange={handleEditUserChange}
                  required
                  className="user-management-form-input"
                  disabled
                />
              </div>
              <div className="user-management-form-group">
                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  name="role"
                  value={editingUser.role}
                  onChange={handleEditUserChange}
                  className="user-management-form-select"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="user-management-modal-actions">
                <button type="button" className="user-management-btn user-management-btn-secondary" onClick={() => setShowEditUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="user-management-btn user-management-btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="user-management-modal-overlay" onClick={() => setShowUserDetailsModal(false)}>
          <div className="user-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-management-modal-header">
              <h3>User Details</h3>
              <button className="user-management-modal-close" onClick={() => setShowUserDetailsModal(false)}>
                &times;
              </button>
            </div>
            <div className="user-management-modal-content">
              <div className="user-management-detail-item">
                <strong>ID:</strong> {selectedUser.id}
              </div>
              <div className="user-management-detail-item">
                <strong>Name:</strong> {selectedUser.name}
              </div>
              <div className="user-management-detail-item">
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div className="user-management-detail-item">
                <strong>Role:</strong> 
                <span className={`user-management-badge ${getRoleColor(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>
              <div className="user-management-detail-item">
                <strong>Status:</strong> 
                <span className={`user-management-badge ${getStatusColor(selectedUser.status)}`}>
                  {selectedUser.status}
                </span>
              </div>
              <div className="user-management-detail-item">
                <strong>Posts Count:</strong> {selectedUser.posts}
              </div>
              <div className="user-management-detail-item">
                <strong>Join Date:</strong> {new Date(selectedUser.joinDate).toLocaleDateString()}
              </div>
              <div className="user-management-detail-item">
                <strong>Last Active:</strong> {new Date(selectedUser.lastActive).toLocaleDateString()}
              </div>
            </div>
            <div className="user-management-modal-actions">
              <button 
                className="user-management-btn user-management-btn-secondary" 
                onClick={() => setShowUserDetailsModal(false)}
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

export default UserManagement;