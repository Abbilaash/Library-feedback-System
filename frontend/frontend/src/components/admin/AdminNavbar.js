import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/admin/logout');
      navigate('/admin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '1rem',
      color: 'white',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '100%',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Library Feedback Admin
        </div>
        
        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <Link to="/admin/dashboard" style={linkStyle}>
            Dashboard
          </Link>
          <Link to="/admin/feedback_view" style={linkStyle}>
            Feedbacks
          </Link>
          <Link to="/admin/analytics" style={linkStyle}>
          Analytics
          </Link>
          <Link to="/admin/reports" style={linkStyle}>
            Reports
          </Link>
          <Link to="/admin/questions" style={linkStyle}>
            Questions
          </Link>
          <Link to="/admin/settings" style={linkStyle}>
            Settings
          </Link>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '0.5rem',
  borderRadius: '4px'
};

export default AdminNavbar;