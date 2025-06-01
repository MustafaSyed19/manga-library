import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import './../styles/register.css';

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
    const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/auth/register", {
        username,
        password,
      });
      const { token, user } = response.data;

      localStorage.setItem("authToken", token);

      console.log("Registration Successful " + user);
      navigate('/home');

    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed");
    }
  };
  return (
    <div className="registration-container">
      <h1>Registration</h1>
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="username">
          <label htmlFor="name">Username:</label>
          <input
            id="name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="password">
            <label htmlFor="password">Password:</label>
            <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="confirmPassword">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;