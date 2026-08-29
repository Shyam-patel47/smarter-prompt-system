import { Response } from 'express';
import Folder from '../models/Folder';
import Prompt from '../models/Prompt';
import { AuthRequest } from '../middleware/auth';

export const getFolders = async (req: AuthRequest, res: Response) => {
  try {
    const folders = await Folder.find({ userId: req.user?.id }).sort({ createdAt: -1 });
    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const folder = await Folder.create({ userId: req.user?.id, name });
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { name },
      { new: true }
    );
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    
    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
  try {
    const folder = await Folder.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // Orphan the prompts instead of deleting them
    await Prompt.updateMany(
      { folderId: folder._id, userId: req.user?.id },
      { folderId: null }
    );

    res.status(200).json({ message: 'Folder deleted and prompts orphaned' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
