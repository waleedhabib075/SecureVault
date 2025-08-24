import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { File } from '../models/File';
import { User } from '../models/User';

const router = express.Router();

// Get all files for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ firebaseUid: req.user.firebaseUid })
      .sort({ uploadedAt: -1 })
      .select('-encryption'); // Don't send encryption data to client

    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file by ID
router.get('/:fileId', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.fileId,
      firebaseUid: req.user.firebaseUid
    }).select('-encryption');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Upload new file
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📁 File upload request received');
    
    const {
      name,
      type,
      size,
      encrypted,
      albumId,
      thumbnail,
      encryption,
      originalUri,
      mimeType
    } = req.body;
    
    console.log(`📁 File details: ${name} (${type}), Size: ${(size / (1024 * 1024)).toFixed(2)} MB`);

    // Validate required fields
    if (!name || !type || !size || !encryption) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check user's storage quota (free tier: 1GB, pro: 10GB, business: 100GB)
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingFiles = await File.find({ firebaseUid: req.user.firebaseUid });
    const totalStorage = existingFiles.reduce((sum, file) => sum + file.size, 0);
    const maxStorage = user.subscription === 'free' ? 1024 * 1024 * 1024 : // 1GB
                      user.subscription === 'pro' ? 10 * 1024 * 1024 * 1024 : // 10GB
                      100 * 1024 * 1024 * 1024; // 100GB

    if (totalStorage + size > maxStorage) {
      return res.status(413).json({ 
        error: 'Storage quota exceeded',
        currentUsage: totalStorage,
        maxStorage,
        required: size
      });
    }

    // Create new file
    const newFile = new File({
      firebaseUid: req.user.firebaseUid,
      name,
      type,
      size,
      encrypted,
      albumId,
      thumbnail,
      encryption,
      originalUri,
      mimeType,
      uploadedAt: new Date(),
      lastModified: new Date(),
    });

    await newFile.save();

    // Update user's last activity
    await User.updateOne(
      { firebaseUid: req.user.firebaseUid },
      { lastLogin: new Date() }
    );

    // Return file without encryption data
    const fileResponse = newFile.toObject();
    const { encryption: _, ...fileWithoutEncryption } = fileResponse;

    res.status(201).json(fileWithoutEncryption);

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Update file metadata
router.put('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { name, albumId } = req.body;

    const file = await File.findOneAndUpdate(
      {
        _id: req.params.fileId,
        firebaseUid: req.user.firebaseUid
      },
      {
        name,
        albumId,
        lastModified: new Date()
      },
      { new: true }
    ).select('-encryption');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ 
      message: 'File updated successfully',
      file 
    });

  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete file
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({
      _id: req.params.fileId,
      firebaseUid: req.user.firebaseUid
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ 
      message: 'File deleted successfully',
      fileId: req.params.fileId
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get files by type
router.get('/type/:fileType', authenticateToken, async (req, res) => {
  try {
    const { fileType } = req.params;
    const files = await File.find({
      firebaseUid: req.user.firebaseUid,
      type: fileType
    })
    .sort({ uploadedAt: -1 })
    .select('-encryption');

    res.json({ files });
  } catch (error) {
    console.error('Error fetching files by type:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get files by album
router.get('/album/:albumId', authenticateToken, async (req, res) => {
  try {
    const { albumId } = req.params;
    const files = await File.find({
      firebaseUid: req.user.firebaseUid,
      albumId: albumId
    })
    .sort({ uploadedAt: -1 })
    .select('-encryption');

    res.json({ files });
  } catch (error) {
    console.error('Error fetching files by album:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get storage usage statistics
router.get('/stats/usage', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ firebaseUid: req.user.firebaseUid });
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileCount = files.length;
    
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });
    const maxStorage = user?.subscription === 'free' ? 100 * 1024 * 1024 : // 100MB
                      user?.subscription === 'pro' ? 1024 * 1024 * 1024 : // 1GB
                      10 * 1024 * 1024 * 1024; // 10GB

    res.json({
      totalSize,
      fileCount,
      maxStorage,
      usagePercentage: Math.round((totalSize / maxStorage) * 100)
    });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    res.status(500).json({ error: 'Failed to fetch storage stats' });
  }
});

export default router;
