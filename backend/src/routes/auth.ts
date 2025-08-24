import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();

// User registration/linking with Firebase
router.post('/link', async (req: Request, res: Response) => {
  try {
    const { firebaseUid, email, displayName } = req.body;

    // Validate input
    if (!firebaseUid || !email || !displayName) {
      return res.status(400).json({
        error: 'Missing required fields: firebaseUid, email, displayName'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ firebaseUid }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        user: {
          id: existingUser._id,
          email: existingUser.email,
          displayName: existingUser.displayName,
          subscription: existingUser.subscription
        }
      });
    }

    // Create new user
    const user = new User({
      firebaseUid,
      email,
      displayName,
      subscription: 'free',
      biometricEnabled: false,
      lastLogin: new Date()
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        subscription: user.subscription,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        subscription: user.subscription,
        biometricEnabled: user.biometricEnabled,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { displayName, avatar, biometricEnabled } = req.body;
    const userId = req.user._id;

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (biometricEnabled !== undefined) updateData.biometricEnabled = biometricEnabled;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        avatar: updatedUser.avatar,
        subscription: updatedUser.subscription,
        biometricEnabled: updatedUser.biometricEnabled,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
