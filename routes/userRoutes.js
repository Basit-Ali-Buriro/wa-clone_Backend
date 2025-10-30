import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Search users by name or email (allows empty query to get all users)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log('🔍 Search users with query:', query);
    
    let users;
    
    if (!query || query.trim() === '') {
      // ✅ Return all users when query is empty
      console.log('📋 Fetching all users...');
      users = await User.find({ 
        _id: { $ne: req.user._id }  // Exclude current user
      })
        .select('name email avatarUrl bio status')
        .limit(100)
        .sort({ name: 1 });
      
      console.log(`✅ Found ${users.length} total users`);
    } else {
      // Search by name or email
      console.log('🔎 Searching with query:', query);
      users = await User.find({
        _id: { $ne: req.user._id },
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
        .select('name email avatarUrl bio status')
        .limit(100)
        .sort({ name: 1 });
      
      console.log(`✅ Found ${users.length} matching users`);
    }
    
    res.json(users);
  } catch (error) {
    console.error('❌ Search users error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user by ID
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email avatarUrl bio status');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;