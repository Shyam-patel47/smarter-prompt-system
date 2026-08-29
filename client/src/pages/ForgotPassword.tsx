import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthLayout } from '../components/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error requesting password reset');
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive a reset link.">
      {success ? (
        <div className="flex flex-col items-center justify-center p-6 bg-surface border border-border rounded-lg text-center">
          <div className="text-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Check your email</h3>
          <p className="text-text-secondary mb-6">
            If an account exists for <strong>{email}</strong>, we have sent a password reset link.
          </p>
          <Link to="/login" className="text-accent font-medium hover:underline">
            Return to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="text-sm text-danger bg-danger/10 p-3 rounded">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-text-primary mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-border bg-transparent rounded-lg p-3 text-text-primary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-shadow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-accent text-white font-medium py-3 rounded-lg hover:bg-accent-hover transition-colors mt-2"
          >
            Send Reset Link
          </button>
        </form>
      )}
      
      {!success && (
        <div className="mt-6 text-center text-sm text-text-secondary">
          Remember your password? <Link to="/login" className="text-accent font-medium hover:underline">Log in</Link>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
