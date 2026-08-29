import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Prompt from '../models/Prompt';
import Folder from '../models/Folder';
import Tag from '../models/Tag';
import Comparison from '../models/Comparison';
import { AuthRequest } from '../middleware/auth';

export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const [prompts, folders, tags, comparisons] = await Promise.all([
      Prompt.find({ userId }),
      Folder.find({ userId }),
      Tag.find({ userId }),
      Comparison.find({ userId })
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: req.user?.id,
      folders,
      tags,
      prompts,
      comparisons
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="smarter_prompt_export.json"');
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    res.status(500).json({ message: 'Server error exporting data' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatarUrl, themePreference } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (themePreference !== undefined) updateData.themePreference = themePreference;

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: 'Incorrect current password' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.tokenVersion += 1; // Invalidate all existing sessions

    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing password' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { confirmWord } = req.body;
    if (confirmWord !== 'DELETE') {
      return res.status(400).json({ message: 'Confirmation failed' });
    }

    const userId = req.user?.id;
    
    // Cascade delete all data
    await Promise.all([
      Prompt.deleteMany({ userId }),
      Folder.deleteMany({ userId }),
      Tag.deleteMany({ userId }),
      Comparison.deleteMany({ userId })
    ]);

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Account permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting account' });
  }
};
