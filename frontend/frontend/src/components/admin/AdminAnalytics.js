import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNavbar from './AdminNavbar'; // Import the AdminNavbar
import { FaEllipsisV } from 'react-icons/fa'; // Import the dropdown icon
import { Pie } from 'react-chartjs-2'; // Import Pie chart

function AdminAnalytics() {
  const [issues, setIssues] = useState([]);
  const [issueCounts, setIssueCounts] = useState({ total: 0, resolved: 0, pending: 0 });
  const [categoryData, setCategoryData] = useState({}); // State for category data
  const [dropdownOpen, setDropdownOpen] = useState(null); // State to manage dropdown visibility
  const [hoveredBox, setHoveredBox] = useState(null); // State to manage hovered count box
  const [statusFilter, setStatusFilter] = useState(''); // State for status filter
  const [categoryFilter, setCategoryFilter] = useState(''); // State for category filter
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [categories, setCategories] = useState([]); // State for categories

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await axios.get('http://localhost:5000/admin/get_issues');
        setIssues(response.data);
      } catch (error) {
        console.error('Error fetching issues:', error);
      }
    };

    const fetchIssueCounts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/admin/get_issue_counts');
        setIssueCounts(response.data);
      } catch (error) {
        console.error('Error fetching issue counts:', error);
      }
    };

    const fetchCategoryData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/admin/get_issue_categories');
        setCategoryData(response.data);
        setCategories(Object.keys(response.data)); // Set categories for the filter
      } catch (error) {
        console.error('Error fetching category data:', error);
      }
    };

    fetchIssues();
    fetchIssueCounts();
    fetchCategoryData();
  }, []);

  const handleFilterChange = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/filter_issues', {
        params: {
          status: statusFilter,
          category: categoryFilter,
          query: searchQuery,
        },
      });
      setIssues(response.data);
    } catch (error) {
      console.error('Error filtering issues:', error);
    }
  };

  const handleStatusChange = async (issue, newStatus) => {
    try {
      let endpoint = '';
      if (newStatus === 'RESOLVED') {
        endpoint = `resolve_issue/${issue._id}`;
      } else if (newStatus === 'SUSPENDED') {
        endpoint = `suspend_issue/${issue._id}`;
      } else if (newStatus === 'PENDING') {
        endpoint = `set_pending_issue/${issue._id}`;
      }

      await axios.put(`http://localhost:5000/admin/${endpoint}`);
      setIssues(prevIssues => prevIssues.map(i => (i._id === issue._id ? { ...i, status: newStatus } : i)));
      setDropdownOpen(null);
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const toggleDropdown = (index) => {
    setDropdownOpen(dropdownOpen === index ? null : index); // Toggle dropdown visibility
  };

  // Prepare data for the pie chart
  const totalIssues = Object.values(categoryData).reduce((acc, count) => acc + count, 0); // Calculate total issues

  const pieChartData = {
    labels: Object.keys(categoryData).map(category => {
      const count = categoryData[category];
      const percentage = ((count / totalIssues) * 100).toFixed(1); // Calculate percentage
      return `${category} (${percentage}%)`; // Format label with percentage
    }),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  return (
    <div style={styles.container}>
      <AdminNavbar /> {/* Include the Admin Navbar */}
      <h2 style={styles.title}>Issues Raised</h2>
      
      {/* Filters and Search Box */}
      <div style={styles.filtersContainer}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by Roll Number or Raised By"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <button onClick={handleFilterChange} style={styles.filterButton}>Search</button>
      </div>

      {/* Issue Counts Section */}
      <div style={styles.countsContainer}>
        <div 
          style={{ ...styles.countBox, ...(hoveredBox === 'total' ? styles.countBoxHover : {}) }}
          onMouseEnter={() => setHoveredBox('total')}
          onMouseLeave={() => setHoveredBox(null)}
        >
          <h3 style={styles.countTitle}>Total Issues</h3>
          <p style={styles.countValue}>{issueCounts.total}</p>
        </div>
        <div 
          style={{ ...styles.countBox, ...(hoveredBox === 'resolved' ? styles.countBoxHover : {}) }}
          onMouseEnter={() => setHoveredBox('resolved')}
          onMouseLeave={() => setHoveredBox(null)}
        >
          <h3 style={styles.countTitle}>Resolved Issues</h3>
          <p style={styles.countValue}>{issueCounts.resolved}</p>
        </div>
        <div 
          style={{ ...styles.countBox, ...(hoveredBox === 'pending' ? styles.countBoxHover : {}) }}
          onMouseEnter={() => setHoveredBox('pending')}
          onMouseLeave={() => setHoveredBox(null)}
        >
          <h3 style={styles.countTitle}>Pending Issues</h3>
          <p style={styles.countValue}>{issueCounts.pending}</p>
        </div>
      </div>

      {/* Pie Chart Section */}
      <div style={{ margin: '20px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h3>Issue Categories Distribution</h3>
        <Pie data={pieChartData} width={400} height={400} />
      </div>

      {issues.length === 0 ? (
        <div style={styles.noData}>No issues found.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Raised By</th>
              <th style={styles.th}>Issue</th>
              <th style={styles.th}>Raise Date</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, index) => (
              <tr key={index}>
                <td style={styles.td}>{issue.raised_by}</td>
                <td style={styles.td}>{issue.issue}</td>
                <td style={styles.td}>{new Date(issue.issue_raise_date).toLocaleString()}</td>
                <td style={styles.td}>{issue.status}</td>
                <td style={styles.td}>
                  <div style={styles.dropdown}>
                    <button
                      style={styles.dropdownButton}
                      onClick={() => toggleDropdown(index)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.dropdownButtonHover.backgroundColor}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.dropdownButton.backgroundColor}
                    >
                      <FaEllipsisV />
                    </button>
                    {dropdownOpen === index && (
                      <div style={styles.dropdownContent}>
                        {issue.status !== 'RESOLVED' && (
                          <div
                            style={styles.dropdownItem}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.dropdownItemHover.backgroundColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            onClick={() => handleStatusChange(issue, 'RESOLVED')}
                          >
                            Resolved
                          </div>
                        )}
                        {issue.status !== 'RESOLVED' && (
                          <div
                            style={styles.dropdownItem}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.dropdownItemHover.backgroundColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            onClick={() => handleStatusChange(issue, 'SUSPENDED')}
                          >
                            Suspend
                          </div>
                        )}
                        {issue.status !== 'RESOLVED' && (
                          <div
                            style={styles.dropdownItem}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.dropdownItemHover.backgroundColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            onClick={() => handleStatusChange(issue, 'PENDING')}
                          >
                            Pending
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
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
    fontFamily: 'Arial, sans-serif', // Use a clean font
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center', // Center the title
  },
  filtersContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  filterSelect: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginRight: '10px',
    flex: '1',
  },
  searchInput: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    flex: '2',
  },
  filterButton: {
    padding: '10px 20px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  countsContainer: {
    display: 'flex',
    justifyContent: 'space-around', // Space around for better alignment
    marginBottom: '20px',
  },
  countBox: {
    flex: 1,
    margin: '0 10px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', // Slightly larger shadow for depth
    textAlign: 'center',
    transition: 'transform 0.2s', // Add a hover effect
  },
  countBoxHover: {
    transform: 'scale(1.05)', // Scale up on hover
  },
  countTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#555',
  },
  countValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#4A90E2', // Use a primary color for the count
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
    fontWeight: 'bold',
  },
  td: {
    borderBottom: '1px solid #ddd',
    padding: '12px',
    color: '#333',
  },
  dropdown: {
    position: 'relative',
    display: 'inline-block',
  },
  dropdownButton: {
    backgroundColor: '#4A90E2', // Button color
    color: 'white', // Text color
    border: 'none',
    borderRadius: '5px', // Rounded corners
    padding: '8px 12px', // Padding for the button
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s, transform 0.2s', // Smooth transition for hover effect
  },
  dropdownButtonHover: {
    backgroundColor: '#357ABD', // Darker shade on hover
    transform: 'scale(1.05)', // Scale up on hover
  },
  dropdownContent: {
    position: 'absolute',
    backgroundColor: '#ffffff', // Background color for dropdown
    minWidth: '160px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 1,
    borderRadius: '5px', // Rounded corners for dropdown
    marginTop: '5px', // Space between button and dropdown
  },
  dropdownItem: {
    padding: '10px 15px', // Padding for dropdown items
    cursor: 'pointer',
    transition: 'background-color 0.3s', // Smooth transition for hover effect
  },
  dropdownItemHover: {
    backgroundColor: '#f0f0f0', // Background color on hover
  },
  noData: {
    color: 'red',
    fontSize: '18px',
    marginTop: '20px',
    textAlign: 'center', // Center the no data message
  },
};

export default AdminAnalytics;