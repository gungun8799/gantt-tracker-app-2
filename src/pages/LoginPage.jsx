import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Pages.css';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

export default function LoginPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);  // ⬅️ Start loading
    console.log('🔐 Attempting login with:', { email, password });
    try {
      const res = await fetch(`http://localhost:4000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
  
      const result = await res.json();
      if (res.ok) {
        setUser({ email: result.email, role: result.role });
        navigate('/overall');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Network error');
    } finally {
      setLoading(false);  // ⬅️ Stop loading
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Datacube Project Tracker</h2>
        {error && <div className="error-message">{error}</div>}
        <input
          className='login-input'
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className='login-input'
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
            <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" /> Logging in...</> : 'Login'}
            </button>      </form>
    </div>
  );
}
