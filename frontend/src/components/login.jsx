import React, { useState } from "react";
import axios from "axios";
import "./../styles/login.css"; 
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post("http://localhost:5000/auth/login", 
                { username, password },
                { withCredentials: true }
            );
            // Assuming your backend returns a token or user data
            const { token, user } = response.data;
            // Save token to localStorage or context
            localStorage.setItem("authToken", token);
            // Redirect or update UI
            
            console.log("Login successful", user);
            navigate('/home');


            
        } catch (err) {
            console.log(err);
            setError(err?.data?.error || "Login failed");
        }
    };

    return (
        <div className="login-container">
            <h1>Login</h1>
            <form onSubmit={handleSubmit} className="login-form">
                <div>
                    <label htmlFor="name">Username:</label>
                    <input
                        id="name"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit">Login</button>
                <p>Don't have an account? <Link to="/register">Register</Link></p>
            </form>
        </div>
    );
};

export default Login;