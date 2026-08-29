import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthLayout } from '../components/AuthLayout';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getStrength(password);
  const strengthText = strength <= 1 ? 'Weak' : strength === 2 ? 'Medium' : 'Strong';
  const strengthColor = strength <= 1 ? 'text-danger' : strength === 2 ? 'text-warning' : 'text-success';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await api.post('/auth/signup', { email, password, confirmPassword });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating account');
    }
  };

  return (
    <AuthLayout title="Get Started" subtitle="Create your account to start building prompts.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="text-sm text-danger bg-danger/10 p-3 rounded">{error}</div>}
        
        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-border bg-transparent rounded-lg p-3 text-text-primary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-shadow"
            placeholder="name@company.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">Password</label>
          <input
            type="password"
            className="w-full border border-border bg-transparent rounded-lg p-3 text-text-primary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-shadow"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
          />
          {password && (
            <div className={`text-xs mt-2 font-medium ${strengthColor}`}>
              Strength: {strengthText}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">Confirm Password</label>
          <input
            type="password"
            className="w-full border border-border bg-transparent rounded-lg p-3 text-text-primary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-shadow"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-accent text-white font-medium py-3 rounded-lg hover:bg-accent-hover transition-colors mt-2"
        >
          Create Account
        </button>
      </form>
      <div className="mt-6 text-sm text-center text-text-secondary">
        Already have an account? <Link to="/login" className="text-accent font-medium hover:underline">Log in</Link>
      </div>
    </AuthLayout>
  );
};

export default Signup;
