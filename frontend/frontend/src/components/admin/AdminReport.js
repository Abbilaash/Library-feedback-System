import React from 'react';
import AdminNavbar from './AdminNavbar';

function AdminReport() {
  return (
    <div style={styles.container}>
      <AdminNavbar />
      <h2 style={styles.title}>Admin Report</h2>
      <div style={styles.content}>
        <p>This is where the report details will be displayed.</p>
      </div>
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
  content: {
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
};

export default AdminReport;
