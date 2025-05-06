import React, { useEffect, useState } from 'react';
import axios from 'axios';

function LibraryFeedbackForm() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [otherInputs, setOtherInputs] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true); // Set loading to true initially

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/users/get_feedback_questions');
        setQuestions([...response.data, { id: 'additional', question: 'Do you want to include something?' }]);
        setStartTime(new Date()); // Record the start time when questions are fetched
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchQuestions();
  }, []);

  const handleOptionChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (value === 'Other') {
      setOtherInputs((prev) => ({ ...prev, [questionId]: '' })); // Reset other input when "Other" is selected
    }
  };

  const handleOtherInputChange = (questionId, value) => {
    setOtherInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const feedbackData = questions.map((question) => ({
      question: question.question,
      answer: question.id === 'additional' ? otherInputs[question.id] : (answers[question.id] === 'Other' ? otherInputs[question.id] : answers[question.id]),
    }));

    const startTimeInSeconds = Math.floor(startTime.getTime() / 1000); // Convert to seconds

    try {
      await axios.post('http://localhost:5000/users/submit_feedback', {
        feedback: feedbackData,
        start_time: startTimeInSeconds,
      });
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Optional loading state
  }

  return (
    <div style={styles.container}>
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
};

export default LibraryFeedbackForm;