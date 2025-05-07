import React, { useEffect, useState } from 'react';
import axios from 'axios';

function LibraryFeedbackForm() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [otherInputs, setOtherInputs] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/users/get_feedback_questions');
        setQuestions([...response.data, { id: 'additional', question: 'Do you want to include something?' }]);
        setStartTime(new Date());
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleOptionChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (value === 'Other') {
      setOtherInputs((prev) => ({ ...prev, [questionId]: '' }));
    }
  };

  const handleOtherInputChange = (questionId, value) => {
    setOtherInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const feedbackData = questions.map((question) => ({
      question: question.question,
      answer: question.id === 'additional' ? otherInputs[question.id] : (answers[question.id] === 'Other' ? otherInputs[question.id] : answers[question.id]),
    }));

    const startTimeInSeconds = Math.floor(startTime.getTime() / 1000);

    try {
      await axios.post('http://localhost:5000/users/submit_feedback', {
        feedback: feedbackData,
        start_time: startTimeInSeconds,
      });
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div style={{ ...styles.container, filter: submitting ? 'blur(5px)' : 'none' }}>
        <h2 style={styles.heading}>GRD Library Floor 3 Feedback</h2>
        {questions.map((q, index) => (
          <div key={q.id} style={styles.questionBlock}>
            <p style={styles.question}>{`${index + 1}) ${q.question}`}</p>
            {q.id === 'additional' && (
              <input
                type="text"
                placeholder="Write your response (optional)"
                value={otherInputs[q.id] || ''}
                onChange={(e) => handleOtherInputChange(q.id, e.target.value)}
                style={styles.blankLineInput}
              />
            )}
            {q.options && q.options.map((opt, idx) => (
              <label key={idx} style={styles.optionLabel}>
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => handleOptionChange(q.id, opt)}
                />
                {opt}
              </label>
            ))}
            <label style={styles.optionLabel}>
              {answers[q.id] === 'Other' && (
                <input
                  type="text"
                  placeholder="Write your response"
                  value={otherInputs[q.id] || ''}
                  onChange={(e) => handleOtherInputChange(q.id, e.target.value)}
                  style={styles.blankLineInput}
                />
              )}
            </label>
          </div>
        ))}
        <button onClick={handleSubmit} style={styles.submitButton}>Submit Feedback</button>
      </div>

      {/* Modal */}
      {submitting && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '15px' }}>Thank you for your feedback!</h3>
            <div style={styles.spinner}></div>
            <h3 style={{ marginBottom: '15px' }}>Please wait...<br />It may take few seconds...</h3>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '40px auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
    position: 'relative',
    zIndex: 1,
  },
  heading: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '28px',
    color: '#2c3e50',
  },
  questionBlock: {
    marginBottom: '30px',
  },
  question: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#34495e',
  },
  optionLabel: {
    display: 'block',
    marginBottom: '14px',
    fontSize: '16px',
    color: '#555',
  },
  blankLineInput: {
    display: 'block',
    marginTop: '10px',
    width: '80%',
    maxWidth: '400px',
    border: 'none',
    borderBottom: '2px solid #aaa',
    fontSize: '16px',
    padding: '6px 0',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#333',
  },
  submitButton: {
    padding: '10px 15px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '30px 40px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    transform: 'scale(1.05)',
    transition: 'transform 0.3s ease',
  },
  spinner: {
    margin: '0 auto',
    width: '40px',
    height: '40px',
    border: '5px solid #ccc',
    borderTop: '5px solid #4A90E2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Add keyframe spinner animation manually to document
const styleSheet = document.styleSheets[0];
const keyframes =
  `@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }`;

styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default LibraryFeedbackForm;
