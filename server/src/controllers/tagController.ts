import { Response } from 'express';
import Tag from '../models/Tag';
import { AuthRequest } from '../middleware/auth';

export const getTags = async (req: AuthRequest, res: Response) => {
  try {
    const tags = await Tag.find({ userId: req.user?.id }).sort({ name: 1 });
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    // Handle compound uniqueness gracefully
    let tag = await Tag.findOne({ userId: req.user?.id, name });
    if (tag) return res.status(200).json(tag); // Return existing instead of error

    tag = await Tag.create({ userId: req.user?.id, name });
    res.status(201).json(tag);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error creating tag' });
  }
};
