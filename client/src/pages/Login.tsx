import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthLayout } from '../components/AuthLayout';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/login', { email: identifier, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="text-sm text-danger bg-danger/10 p-3 rounded">{error}</div>}
        
        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">Email</label>
          <input
            type="email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            className="w-full border border-border bg-transparent rounded-lg p-3 text-text-primary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-shadow"
            placeholder="name@company.com"
            required
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-bold text-text-primary">Password</label>
            <Link to="/forgot-password" className="text-sm text-accent hover:underline">Forgot password?</Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-border bg-transparent rounded-lg p-3 text-text-primary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-shadow"
            placeholder="••••••••"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-accent text-white font-medium py-3 rounded-lg hover:bg-accent-hover transition-colors"
        >
          Log In
        </button>
      </form>
      <div className="mt-6 text-sm text-center text-text-secondary">
        Don't have an account? <Link to="/signup" className="text-accent font-medium hover:underline">Sign up</Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
