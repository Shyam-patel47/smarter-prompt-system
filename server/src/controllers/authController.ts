import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { emailService } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';

const issueToken = (res: Response, user: any) => {
  const token = jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword } = req.body;
    
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Email, password, and confirm password are required' });
    }

    if (password !== confirmPassword) {
       return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'Account already exists — log in instead' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      passwordHash,
      emailVerified: true, // Auto-verified in this simplified flow
    });

    await user.save();
    issueToken(res, user);

    res.status(201).json({ 
      message: 'Signup complete', 
      user: { id: user._id, email: user.email } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    issueToken(res, user);

    res.status(200).json({ 
      message: 'Logged in successfully', 
      user: { id: user._id, email: user.email } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't leak user existence
      return res.status(200).json({ message: 'If this account exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetTokenHash = resetTokenHash;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const sent = await emailService.sendResetEmail(user.email!, resetUrl);
    
    if (!sent) {
      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }

    res.status(200).json({ message: 'If this account exists, a reset link has been sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
       return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Find a user who has a resetTokenExpiry in the future
    // We have to fetch users with active reset tokens and then compare the hash
    const users = await User.find({ resetTokenExpiry: { $gt: new Date() } });
    
    let targetUser = null;
    for (const user of users) {
       if (user.resetTokenHash) {
          const isMatch = await bcrypt.compare(token, user.resetTokenHash);
          if (isMatch) {
             targetUser = user;
             break;
          }
       }
    }

    if (!targetUser) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    targetUser.passwordHash = await bcrypt.hash(newPassword, 10);
    targetUser.resetTokenHash = undefined;
    targetUser.resetTokenExpiry = undefined;
    targetUser.tokenVersion += 1; // Invalidate old sessions

    await targetUser.save();

    res.status(200).json({ message: 'Password reset successful. Please log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.tokenVersion += 1;
    await user.save();
    
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.status(200).json({ message: 'Logged out of all devices successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
