import React, { useState } from 'react';
import { getUsers } from '../storage.ts';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    try {
      const users = getUsers();
      if (users[username] && users[username] === password) {
        setError('');
        onLoginSuccess(username);
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="card p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-fade-in-up border-cyan-500/20">
      <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500 text-center">Welcome Back</h2>
      <p className="text-slate-400 mb-8 text-center">Please login to continue your match.</p>
      
      <div className="space-y-6 mb-6">
        <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="input-base"
            />
        </div>
        <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your password"
              className="input-base"
            />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-6">{error}</p>}
      
      <div className="mt-8 text-center">
        <button
          onClick={handleLogin}
          className="btn-primary w-full"
        >
          Login
        </button>
        <p className="text-sm text-slate-400 mt-6">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="btn-text">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;