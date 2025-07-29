
import React, { useState, useCallback } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'avi' && password === 'avi') {
      setError('');
      onLoginSuccess();
    } else {
      setError('Invalid username or password. Please try again.');
    }
  }, [username, password, onLoginSuccess]);

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Welcome Back
            </h1>
            <p className="text-slate-400 mt-2">Please login to continue.</p>
        </div>
      <form onSubmit={handleLogin}>
        <div className="space-y-4 mb-6">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
            </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
        
        <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-md transition duration-200"
            >
              Login
            </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
