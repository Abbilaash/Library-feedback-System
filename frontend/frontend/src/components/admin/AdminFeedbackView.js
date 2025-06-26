import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNavbar from './AdminNavbar'; // Import the AdminNavbar
import { FaSearch, FaTrash, FaPrint } from 'react-icons/fa'; // Import icons
import { useNavigate } from 'react-router-dom';

function AdminFeedbackView() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('roll_no'); // Default filter type
  const [startDate, setStartDate] = useState(''); // State for start date
  const [endDate, setEndDate] = useState(''); // State for end date
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/admin/get_feedback_submissions');
        setFeedbacks(response.data);
        setFilteredFeedbacks(response.data); // Initialize filtered feedbacks
      } catch (error) {
        console.error('Error fetching feedback submissions:', error);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleSearch = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/search_feedback', {
        params: {
          query: searchQuery,
          filter: filterType,
          startDate: startDate,
          endDate: endDate,
        },
      });
      setFilteredFeedbacks(response.data);
    } catch (error) {
      console.error('Error searching feedbacks:', error);
    }
  };

  const clearFilters = () => {
    setSearchQuery(''); // Clear the search query
    setFilterType('roll_no'); // Reset to default filter type
    setStartDate(''); // Clear start date
    setEndDate(''); // Clear end date
    setFilteredFeedbacks(feedbacks); // Reset filtered feedbacks to all feedbacks
  };

  const handlePrint = () => {
    window.print(); // Simple print functionality
  };

  if (loading) {
    return <div>Loading...</div>; // Optional loading state
  }

  return (
    <div style={styles.container}>
      <AdminNavbar /> {/* Include the Admin Navbar */}
      <h2 style={styles.title}>Feedback Submissions</h2>
      <div style={styles.filterContainer}>
        <select onChange={(e) => setFilterType(e.target.value)} style={styles.select}>
          <option value="roll_no">Filter by Roll Number</option>
          <option value="keyword">Filter by Keyword in Answer</option>
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          style={styles.input}
        />
        <button onClick={handleSearch} style={styles.button}>
          <FaSearch /> Search
        </button>
        <button onClick={clearFilters} style={styles.clearButton}>
          <FaTrash /> Clear Filters
        </button>
      </div>
      <div style={styles.dateContainer}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={styles.input}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={styles.input}
        />
        <button onClick={handlePrint} style={styles.printButton}>
          <FaPrint /> Print
        </button>
      </div>
      {filteredFeedbacks.length === 0 ? (
        <div style={styles.noData}>No data found.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Feedbacks</th>
              <th style={styles.th}>Date & Time</th>
              <th style={styles.th}>Time Taken (s)</th>
              <th style={styles.th}>Issue Presence</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.map((feedback, index) => (
              <tr key={index}>
                <td style={styles.td}>{feedback.roll_no}</td>
                <td style={styles.td}>
                  {Array.isArray(feedback.feedback_answers) && feedback.feedback_answers.length > 0 ? (
                    feedback.feedback_answers.map((item, index) => (
                      <div key={index}>
                        <strong>{item.question}:</strong> {item.answer}
                      </div>
                    ))
                  ) : (
                    'No answers provided'
                  )}
                </td>
                <td style={styles.td}>{new Date(feedback.date).toLocaleString()}</td>
                <td style={styles.td}>{feedback.feedback_time_taken}</td>
                <td style={styles.td}>{feedback.issue_presence || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f4f4f4',
    minHeight: '100vh',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  select: {
    marginRight: '10px',
    padding: '10px',
  },
  input: {
    marginRight: '10px',
    padding: '10px',
    width: '200px',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '10px 15px',
    backgroundColor: '#E94E77',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
  printButton: {
    padding: '10px 15px',
    backgroundColor: '#FFC107',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
  groupButton: {
    padding: '10px 15px',
    backgroundColor: '#28A745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
  noData: {
    color: 'red',
    fontSize: '18px',
    marginTop: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  th: {
    borderBottom: '2px solid #ddd',
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
  },
  td: {
    borderBottom: '1px solid #ddd',
    padding: '12px',
  },
  dateContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '10px',
  },
};

export default AdminFeedbackView;