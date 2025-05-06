import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import logo from '../../assets/logo.png';         // Your logo
import psgBackground from '../../assets/psg.jpeg'; // Fullscreen PSG photo

function UserLogin() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userEmail = decoded.email;

    if (!userEmail.endsWith('@psgtech.ac.in')) {
      setError("Access restricted to @psgtech.ac.in email addresses.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/users/login", {
        email: userEmail
      });

      if (response.status === 200) {
        navigate("/feedback_entry");
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || err.response.data.error);
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  const styles = {
    background: {
      backgroundImage: `url(${psgBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -1,
    },
    container: {
      position: 'relative',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      textAlign: 'center',
      width: '90%',
      maxWidth: '400px',
    },
    logo: {
      width: '100px',
      marginBottom: '20px',
    },
    error: {
      color: 'red',
      backgroundColor: '#ffebee',
      padding: '10px',
      marginBottom: '20px',
      borderRadius: '4px',
    },
  };

  return (
    <>
      <div style={styles.background}></div>
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <img src={logo} alt="Logo" style={styles.logo} />
          <h2>User Login</h2>

          {error && <div style={styles.error}>{error}</div>}

          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => setError("Login Failed")}
          />
        </div>
      </div>
    </>
  );
}

export default UserLogin;
