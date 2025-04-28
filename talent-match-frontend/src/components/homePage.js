import React, { useState, useEffect } from 'react';
import './homePage.css';

const JobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary_range: '',
    experience_level: '',
    job_type: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [filter, setFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    resume: null,
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isApplicationsModalVisible, setIsApplicationsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false); // Separate modal for details
  const [isScoreCardVisible, setIsScoreCardVisible] = useState(false);
  const [matchingScore, setMatchingScore] = useState(null);
  const [isChatbotModalVisible, setIsChatbotModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState(""); // Corrected syntax
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [topic, setTopic] = useState(""); // Dynamically set based on the job applied for
  const [difficulty, setDifficulty] = useState("medium");
  const chatbotIconUrl = "https://cdn-icons-png.flaticon.com/512/4712/4712105.png"; // Online chatbot icon URL

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:5000/jobs');
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }
      const data = await response.json(); // Parse JSON directly
      setJobs(data); // Set jobs from backend response
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to load jobs. Please try again later.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/post_job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to post job: ${response.statusText}`);
      }

      const newJob = await response.json();
      setJobs((prevJobs) => [newJob, ...prevJobs]);
      setFormData({
        title: '',
        description: '',
        location: '',
        salary_range: '',
        experience_level: '',
        job_type: '',
      });

      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
      setIsFormVisible(false);
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value.toLowerCase());
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData({ ...applicationData, [name]: value });
  };

  const handleResumeUpload = (e) => {
    setApplicationData({ ...applicationData, resume: e.target.files[0] });
  };

  const handleApplyNow = (job) => {
    setSelectedJob(job); // Dynamically set the selected job
    setIsModalVisible(true); // Open the application modal
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (!selectedJob) {
      alert("No job selected!");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', applicationData.name);
      formDataToSend.append('email', applicationData.email);
      formDataToSend.append('resume', applicationData.resume);
      formDataToSend.append('job_id', selectedJob.job_id);

      const response = await fetch('http://localhost:5000/apply', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`Failed to submit application: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.status === "success") {
        setMatchingScore(result.matching_score);
        setIsScoreCardVisible(true);
      } else {
        alert(`Failed to submit application: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("An error occurred while submitting your application.");
    } finally {
      setIsModalVisible(false);
      setApplicationData({ name: '', email: '', resume: null });
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setApplicationData({ name: '', email: '', resume: null });
  };

  const handleSeeDetails = (job) => {
    setSelectedJob(job);
    setIsDetailsModalVisible(true); // Open details modal
  };

  const handleDetailsModalClose = () => {
    setIsDetailsModalVisible(false);
    setSelectedJob(null);
  };

  const handleSeeApplications = async (jobId) => {
    try {
      const response = await fetch(`http://localhost:5000/applications/${jobId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }

      const result = await response.json();
      setApplications(result);
      setIsApplicationsModalVisible(true);
    } catch (error) {
      console.error("Error fetching applications:", error);
      alert("An error occurred while fetching applications.");
    }
  };

  const handleApplicationsModalClose = () => {
    setIsApplicationsModalVisible(false);
    setApplications([]);
  };

  const handleScoreCardClose = () => {
    setIsScoreCardVisible(false);
    setMatchingScore(null);
  };

  const handleChatbotOpen = () => {
    setIsChatbotModalVisible(true);
    setChatMessages([
      {
        sender: "bot",
        text: "👋 Welcome to the TalentMatch Quiz! Let's test your knowledge. Click 'Start Quiz' to begin.",
        timestamp: new Date().toLocaleTimeString()
      },
    ]);
  };

  const startQuiz = async () => {
    try {
      const response = await fetch("http://localhost:5000/start_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: selectedJob?.title,
          job_id: selectedJob?.job_id,
          user_id: "omar", // Include user_id (applicant's name) dynamically
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start quiz: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.status === "success") {
        setTopic(selectedJob?.title || "General");
        setQuizStarted(true);
        sessionStorage.setItem("session_id", result.session_id);
        await fetchNextQuestion();
      } else {
        alert(`Failed to start quiz: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert("An error occurred while starting the quiz.");
    }
  };

  const fetchNextQuestion = async () => {
    try {
      const session_id = sessionStorage.getItem("session_id");
      if (!session_id) {
        alert("Session expired. Please restart the quiz.");
        return;
      }

      const response = await fetch("http://localhost:5000/next_question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, difficulty }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch next question: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.status === "success") {
        if (result.finished) {
          setChatMessages((prev) => [
            ...prev, 
            { 
              sender: "bot", 
              text: result.message, 
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
          setQuizStarted(false);
          return;
        }

        setCurrentQuestion(result);
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `🌱 Question ${result.q_number}/5\n${result.question}\n` +
                  Object.entries(result.options)
                        .map(([key, value]) => `${key}) ${value}`).join('\n'),
            timestamp: new Date().toLocaleTimeString()
          },
        ]);
      } else {
        alert(`Failed to fetch next question: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching next question:", error);
      alert("An error occurred while fetching the next question.");
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || !quizStarted || !currentQuestion) return;

    const session_id = sessionStorage.getItem("session_id"); // Retrieve session_id
    if (!session_id) {
      alert("Session expired. Please restart the quiz.");
      return;
    }

    const newMessage = { 
      sender: "user", 
      text: userMessage.toUpperCase(), 
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages((prevMessages) => [...prevMessages, newMessage]);

    try {
      const response = await fetch("http://localhost:5000/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id, // Pass session_id dynamically
          answer: userMessage.toUpperCase(),
        }),
      });

      const result = await response.json();
      if (response.ok && result.status === "success") {
        setChatMessages((prev) => [
          ...prev,
          { 
            sender: "bot", 
            text: result.feedback, 
            timestamp: new Date().toLocaleTimeString()
          },
        ]);

        setUserScore(result.score);
        setQuestionIndex((prev) => prev + 1);
        setUserMessage("");

        if (result.finished) {
          setChatMessages((prev) => [
            ...prev,
            { 
              sender: "bot", 
              text: result.result_message, 
              timestamp: new Date().toLocaleTimeString()
            },
          ]);
          setQuizStarted(false);
          setCurrentQuestion(null);
        } else {
          await fetchNextQuestion();
        }
      } else {
        alert(`Failed to submit answer: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("An error occurred while submitting your answer.");
    }
  };

  const handleChatbotModalClose = () => {
    setIsChatbotModalVisible(false);
    setChatMessages([]);
  };

  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const filteredJobs = filter
    ? jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(filter) ||
          job.location.toLowerCase().includes(filter) ||
          job.description.toLowerCase().includes(filter)
      )
    : jobs;

  return (
    <div className="job-board-container">
      <header className="job-board-header">
        <h1>Job Board</h1>
        <button 
          className="toggle-form-button" 
          onClick={() => setIsFormVisible(!isFormVisible)}
        >
          {isFormVisible ? 'Cancel' : 'Post a Job'}
        </button>
      </header>
      
      {successMessage && (
        <div className="success-message">
          <p>Job posted successfully!</p>
        </div>
      )}
      
      {isFormVisible && (
        <div className="job-form-section">
          <h2>Post a New Job</h2>
          <form className="job-posting-form" onSubmit={handlePostJob}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Job Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior React Developer"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Remote, New York, NY"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Job Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the role, responsibilities, and qualifications"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="salary_range">Salary Range</label>
                <input
                  type="text"
                  id="salary_range"
                  name="salary_range"
                  value={formData.salary_range}
                  onChange={handleInputChange}
                  placeholder="e.g., $80,000 - $120,000"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="experience_level">Experience Level</label>
                <select
                  id="experience_level"
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select level</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="job_type">Job Type</label>
              <select
                id="job_type"
                name="job_type"
                value={formData.job_type}
                onChange={handleInputChange}
                required
              >
                <option value="">Select type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? 'Posting...' : 'Post Job'}
              </button>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={() => setIsFormVisible(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {isDetailsModalVisible && selectedJob && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={handleDetailsModalClose}>&times;</button>
            <h2>{selectedJob.title}</h2>
            <p><strong>Location:</strong> {selectedJob.location}</p>
            <p><strong>Salary Range:</strong> {selectedJob.salary_range || 'N/A'}</p>
            <p><strong>Experience Level:</strong> {selectedJob.experience_level}</p>
            <p><strong>Job Type:</strong> {selectedJob.job_type}</p>
            <p><strong>Description:</strong> {selectedJob.description}</p>
            <div className="modal-actions">
              <button className="apply-button" onClick={() => handleApplyNow(selectedJob)}>Apply Now</button>
              <button className="cancel-button" onClick={handleDetailsModalClose}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {isModalVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Apply for Job</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={applicationData.name}
                  onChange={handleModalInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={applicationData.email}
                  onChange={handleModalInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="resume">Resume</label>
                <input
                  type="file"
                  id="resume"
                  name="resume"
                  onChange={handleResumeUpload}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Submit</button>
                <button type="button" className="cancel-button" onClick={handleModalCancel}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isApplicationsModalVisible && (
        <div className="modal-overlay">
          <div className="modal applications-modal">
            <button className="modal-close" onClick={handleApplicationsModalClose}>&times;</button>
            <h2>Applications for {selectedJob?.title}</h2>
            {applications.length > 0 ? (
              <ul className="applications-list">
                {applications.map((app, index) => (
                  <li key={index} className="application-card">
                    <p><strong>Name:</strong> {app.applicant_name}</p>
                    <p><strong>Email:</strong> {app.email}</p>
                    <p><strong>Matching Score:</strong> {app.matching_score}</p>
                    <p><strong>Resume:</strong> <a href={app.resume} target="_blank" rel="noopener noreferrer">View Resume</a></p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-applications-message">No applications found for this job.</p>
            )}
            <button className="cancel-button" onClick={handleApplicationsModalClose}>Close</button>
          </div>
        </div>
      )}
      
      {isScoreCardVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Application Submitted Successfully!</h2>
            <p><strong>Matching Score:</strong> {matchingScore}</p>
            {matchingScore < 0.4 ? (
              <>
                <p>You are rejected because your resume doesn't align with the job you applied for.</p>
                <div className="modal-actions">
                  <button className="cancel-button" onClick={handleScoreCardClose}>Return</button>
                </div>
              </>
            ) : (
              <>
                <p>Your resume is aligned with the job. Would you like to take the chatbot test?</p>
                <div className="modal-actions">
                  <button className="submit-button" onClick={handleChatbotOpen}>Take the Chatbot Test</button>
                  <button className="cancel-button" onClick={handleScoreCardClose}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {isChatbotModalVisible && (
        <div className="modal-overlay">
          <div className="modal chatbot-modal">
            <div className="chatbot-header">
              <img src={chatbotIconUrl} alt="Chatbot Icon" />
              <h2>Chatbot Assistant</h2>
              <button className="modal-close" onClick={handleChatbotModalClose}>&times;</button>
            </div>
            <div className="chat-window">
              <div className="chat-messages">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message ${message.sender === "user" ? "user-message" : "bot-message"}`}
                  >
                    {message.sender === "bot" && <img src={chatbotIconUrl} alt="Bot Icon" />}
                    <div className="message-text">{message.text}</div>
                    <span className="timestamp">{message.timestamp}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Type your message..."
                />
                {!quizStarted && (
                  <button className="start-btn" onClick={startQuiz}>
                    Start Quiz
                  </button>
                )}
                <button onClick={handleSendMessage}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="jobs-section">
        <div className="jobs-header">
          <h2>Available Jobs ({filteredJobs.length})</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search jobs..."
              value={filter}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="jobs-list">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job.job_id} className="job-card">
                <div className="job-card-header">
                  <h3>{job.title}</h3>
                  <span className="job-type">{job.job_type}</span>
                </div>
                <div className="job-card-details">
                  <div className="job-location">
                    <i className="location-icon">📍</i> {job.location}
                  </div>
                  <div className="job-salary">
                    <i className="salary-icon">💰</i> {job.salary_range || 'N/A'}
                  </div>
                  <div className="job-experience">
                    <i className="experience-icon">🎯</i> {job.experience_level}
                  </div>
                </div>
                <div className="job-description">
                  <p>{job.description}</p>
                </div>
                <div className="job-card-footer">
                  <button className="details-button" onClick={() => handleSeeDetails(job)}>See Details</button>
                  <button className="apply-button" onClick={() => handleApplyNow(job)}>Apply Now</button>

                  <button className="applications-button" onClick={() => handleSeeApplications(job.job_id)}>See Applications</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-jobs-message">
              <p>No jobs found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobBoard;