import React, { useState } from 'react';

interface RegisterProps {
  onRegisterSuccess: (username: string) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = () => {
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    try {
      const users = JSON.parse(localStorage.getItem('youbeeCricketUsers') || '{}');
      if (users[username]) {
        setError('Username already exists. Please choose another one.');
      } else {
        users[username] = password;
        localStorage.setItem('youbeeCricketUsers', JSON.stringify(users));
        setError('');
        onRegisterSuccess(username);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="card p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto animate-fade-in-up">
      <h2 className="text-3xl font-bold mb-2 text-emerald-400 text-center">Create Account</h2>
      <p className="text-slate-400 mb-8 text-center">Join now to save your match progress.</p>
      
      <div className="space-y-6 mb-6">
        <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="w-full bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
        <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              placeholder="Create a password"
              className="w-full bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-6">{error}</p>}
      
      <div className="mt-8 text-center">
        <button
          onClick={handleRegister}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-md transition duration-200"
        >
          Register
        </button>
        <p className="text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="font-semibold text-emerald-400 hover:text-emerald-300">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;