import { NextFunction, Request, Response } from 'express';
import { firebaseAuth } from '../config/firebase';
import { User } from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    console.log('🔐 Authenticating token for request:', req.path);
    console.log('📱 Token length:', token.length);

    // Verify Firebase token
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    console.log('✅ Token verified successfully for UID:', decodedToken.uid);
    
    // Find user in database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      console.log('❌ User not found in database for UID:', decodedToken.uid);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log('✅ User found in database:', user.email);

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    
    // Type-safe error handling
    if (error && typeof error === 'object' && 'name' in error && 'message' in error && 'code' in error) {
      console.error('❌ Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        code: (error as any).code
      });
    } else {
      console.error('❌ Error details: Unknown error type');
    }
    
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireSubscription = (requiredLevel: 'pro' | 'business') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const subscriptionLevels = {
      'free': 0,
      'pro': 1,
      'business': 2
    };

    if (subscriptionLevels[req.user.subscription as keyof typeof subscriptionLevels] < subscriptionLevels[requiredLevel]) {
      res.status(403).json({ 
        error: `${requiredLevel} subscription required`,
        currentSubscription: req.user.subscription
      });
      return;
    }

    next();
  };
};
