import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminNavbar from './AdminNavbar';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Register all necessary components
Chart.register(...registerables);

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState([]);
  const [loginData, setLoginData] = useState([]);
  const [days, setDays] = useState(5); // Default to 5 days
  const [feedbackRate, setFeedbackRate] = useState(0);
  const [loginRate, setLoginRate] = useState(0);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('http://localhost:5000/admin/check_session');
        if (!response.data.logged_in) {
          navigate('/admin'); // Redirect to login if not logged in
        }
      } catch (error) {
        navigate('/admin'); // Redirect to login on error
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const fetchCounts = async (days) => {
    try {
      const feedbackResponse = await axios.get(`http://localhost:5000/admin/feedback_count?days=${days}`);
      const loginResponse = await axios.get(`http://localhost:5000/admin/login_count?days=${days}`);
      setFeedbackData(Object.values(feedbackResponse.data));
      setLoginData(Object.values(loginResponse.data));
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  };

  const fetchFeedbackRate = async (days) => {
    try {
      const response = await axios.get(`http://localhost:5000/admin/feedback_rate/${days}`);
      setFeedbackRate(response.data.rate);
    } catch (err) {
      console.error('Failed to fetch feedback rate:', err);
    }
  };

  const fetchLoginRate = async (days) => {
    try {
      const response = await axios.get(`http://localhost:5000/admin/login_rate/${days}`);
      setLoginRate(response.data.rate);
    } catch (err) {
      console.error('Failed to fetch login rate:', err);
    }
  };

  useEffect(() => {
    if (days >= 5) { // Only fetch if days is valid
      fetchCounts(days);
      fetchFeedbackRate(days); // Fetch feedback rate for the new number of days
      fetchLoginRate(days); // Fetch login rate for the new number of days
    }
  }, [days]); // Dependency array includes days

  const handleDaysChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setDays(value); // Update days regardless of the value
    if (value < 5) {
      setWarning('Please enter a number of days greater than or equal to 5.');
    } else {
      setWarning('');
      fetchCounts(value); // Fetch new data based on the new number of days
      fetchFeedbackRate(value); // Fetch feedback rate for the new number of days
      fetchLoginRate(value); // Fetch login rate for the new number of days
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Optional loading state
  }

  // Prepare data for the feedback chart
  const feedbackChartData = {
    labels: Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    }),
    datasets: [
      {
        label: 'Feedback Count',
        data: feedbackData,
        backgroundColor: ['rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(255, 99, 132, 1)'],
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  // Prepare data for the login chart
  const loginChartData = {
    labels: Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    }),
    datasets: [
      {
        label: 'Login Count',
        data: loginData,
        backgroundColor: ['rgba(75, 192, 192, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)'],
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  return (
    <div style={styles.container}>
      <AdminNavbar />
      <h2 style={styles.title}>Admin Dashboard</h2>
      <div style={styles.selectContainer}>
        <label htmlFor="days" style={styles.label}>Enter Number of Days (min 5): </label>
        <input
          type="number"
          id="days"
          value={days}
          onChange={handleDaysChange}
          min="5"
          style={styles.input}
        />
        {warning && <div style={styles.warning}>{warning}</div>}
      </div>
      <div style={styles.chartContainer}>
        <div style={styles.chart}>
          <h3 style={styles.chartTitle}>Feedback Count (Last {days} Days)</h3>
          <Line data={feedbackChartData} options={{ responsive: true }} />
        </div>
        <div style={styles.chart}>
          <h3 style={styles.chartTitle}>Login Count (Last {days} Days)</h3>
          <Line data={loginChartData} options={{ responsive: true }} />
        </div>
      </div>
      <div style={styles.rateContainer}>
        <div style={styles.rateCard}>
          <h3 style={styles.chartTitle}>Feedback Rate</h3>
          <p>{feedbackRate.toFixed(2)} feedbacks/day</p>
        </div>
        <div style={styles.rateCard}>
          <h3 style={styles.chartTitle}>Login Rate</h3>
          <p>{loginRate.toFixed(2)} logins/day</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f4f4f4',
    padding: '20px',
  },
  title: {
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  selectContainer: {
    marginBottom: '20px',
  },
  label: {
    marginRight: '10px',
    fontSize: '16px',
  },
  input: {
    padding: '5px',
    fontSize: '16px',
    width: '100px',
  },
  warning: {
    color: 'red',
    marginTop: '5px',
  },
  chartContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  chart: {
    width: '48%', // Adjust width to fit side by side
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
  },
  chartTitle: {
    marginBottom: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  rateContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  rateCard: {
    flex: 1,
    margin: '0 10px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.2s', // Add transition for the pop effect
  },
  rateCardHover: {
    transform: 'scale(1.05)', // Scale up on hover
  },
};

export default AdminDashboard;