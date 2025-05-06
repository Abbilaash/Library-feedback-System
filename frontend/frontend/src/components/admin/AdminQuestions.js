import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNavbar from './AdminNavbar'; // Import the AdminNavbar
import { useNavigate } from 'react-router-dom';

function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '', '']); // 5 options
  const [includeOther, setIncludeOther] = useState(false); // State to track "Other" option
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeedbackQuestions();
  }, []);

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

  const fetchFeedbackQuestions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/get_feedback_questions');
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching feedback questions:', error);
    }
  };

  const handleAddQuestion = async () => {
    try {
      await axios.post('http://localhost:5000/admin/add_feedback_questions', {
        question: newQuestion,
        options: newOptions.filter(option => option), // Filter out empty options
        include_other: includeOther, // Send the includeOther flag
      });
      setNewQuestion('');
      setNewOptions(['', '', '', '', '']);
      setIncludeOther(false); // Reset the "Other" option
      fetchFeedbackQuestions(); // Refresh the list
    } catch (error) {
      console.error('Error adding feedback question:', error);
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/admin/delete_feedback_question/${id}`);
      fetchFeedbackQuestions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting feedback question:', error);
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newOptions];
    updatedOptions[index] = value;
    setNewOptions(updatedOptions);
  };

  const addOption = () => {
    setNewOptions([...newOptions, '']); // Add a new empty option
  };

  if (loading) {
    return <div>Loading...</div>; // Optional loading state
  }

  return (
    <div style={styles.container}>
      <AdminNavbar /> {/* Include the Admin Navbar */}
      <h2 style={styles.title}>Manage Feedback Questions</h2>
      <div style={styles.addQuestionContainer}>
        <h3 style={styles.subtitle}>Add New Question</h3>
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Enter question"
          style={styles.input}
        />
        {newOptions.map((option, index) => (
          <div key={index} style={styles.optionContainer}>
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              style={styles.input}
            />
          </div>
        ))}
        <label style={styles.optionLabel}>
          <input
            type="checkbox"
            checked={includeOther}
            onChange={() => setIncludeOther(!includeOther)}
          />
          Include "Other" option
        </label>
        <button onClick={addOption} style={styles.button}>Add Option</button>
        <button onClick={handleAddQuestion} style={styles.button}>Add Question</button>
      </div>
      <h3 style={styles.subtitle}>Existing Questions</h3>
      <ul style={styles.questionList}>
        {questions.map((q) => (
          <li key={q.id} style={styles.questionItem}>
            <div>
              <strong>{q.question}</strong>
              <ul style={styles.optionsList}>
                {q.options.map((option, index) => (
                  <li key={index} style={styles.optionItem}>{option}</li>
                ))}
              </ul>
            </div>
            <button onClick={() => handleDeleteQuestion(q.id)} style={styles.deleteButton}>Delete</button>
          </li>
        ))}
      </ul>
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
  subtitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
  addQuestionContainer: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    width: '100%',
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
  questionList: {
    listStyleType: 'none',
    padding: 0,
  },
  questionItem: {
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '5px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  optionsList: {
    listStyleType: 'none',
    padding: '5px 0 0 20px', // Indent options
  },
  optionItem: {
    marginBottom: '5px',
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default AdminQuestions;