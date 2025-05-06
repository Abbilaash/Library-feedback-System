import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNavbar from './AdminNavbar'; // Import the AdminNavbar

function AdminSettings() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [lastLogins, setLastLogins] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLastLogins();
    checkSession(); // Fetch the session username
  }, []);

  const checkSession = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/check_session');
      if (response.data.logged_in) {
        setUsername(response.data.username); // Set the username from session
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const fetchLastLogins = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/view_last_logins');
      setLastLogins(response.data);
    } catch (error) {
      console.error('Error fetching last logins:', error);
    }
  };

  const handleChangePassword = async () => {
    try {
      await axios.post('http://localhost:5000/admin/change_password', {
        username,
        new_password: newPassword,
      });
      setSuccess('Password changed successfully.');
      setError('');
    } catch (error) {
      setError(error.response.data.error || 'Error changing password.');
      setSuccess('');
    }
  };

  const handleAddAdmin = async () => {
    try {
      await axios.post('http://localhost:5000/admin/add_admin', {
        username: newAdminUsername,
        password: newAdminPassword,
      });
      setSuccess('Admin added successfully.');
      setError('');
      fetchLastLogins(); // Refresh the list of last logins
    } catch (error) {
      setError(error.response.data.error || 'Error adding admin.');
      setSuccess('');
    }
  };

  const handleDeleteAdmin = async (adminUsername) => {
    try {
      await axios.delete(`http://localhost:5000/admin/delete_admin/${adminUsername}`);
      setSuccess('Admin deleted successfully.');
      setError('');
      fetchLastLogins(); // Refresh the list of last logins
    } catch (error) {
      setError(error.response.data.error || 'Error deleting admin.');
      setSuccess('');
    }
  };

  return (
    <div style={styles.container}>
      <AdminNavbar />
      <h2 style={styles.heading}>Settings for {username}</h2>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.section}>
        <h3>Change Password</h3>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleChangePassword} style={styles.button}>Change Password</button>
      </div>

      <div style={styles.section}>
        <h3>Add New Admin</h3>
        <input
          type="text"
          placeholder="New Admin Username"
          value={newAdminUsername}
          onChange={(e) => setNewAdminUsername(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="New Admin Password"
          value={newAdminPassword}
          onChange={(e) => setNewAdminPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAddAdmin} style={styles.button}>Add Admin</button>
      </div>

      <div style={styles.section}>
        <h3>Last Logins of Admins</h3>
        <ul>
          {lastLogins.map((admin) => (
            <li key={admin.username}>
              {admin.username} - Last Login: {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
              <button onClick={() => handleDeleteAdmin(admin.username)} style={styles.deleteButton}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '100%',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '28px',
    color: '#2c3e50',
  },
  section: {
    marginBottom: '30px',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  deleteButton: {
    marginLeft: '10px',
    padding: '5px 10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '4px',
    backgroundColor: '#ffebee',
  },
  success: {
    color: 'green',
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '4px',
    backgroundColor: '#e8f5e9',
  },
};

export default AdminSettings;
