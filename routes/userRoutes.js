import express from 'express';
import User from '../models/User.js';
import  authMiddleware  from '../middleware/authMiddleware.js';

const router = express.Router();

// Search users
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ msg: 'Search query required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user.id }, // Exclude current user
    })
      .select('name email avatarUrl')
      .limit(10);

    res.json({ users });
  } catch (err) {
    console.error('User search error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all users (for groups)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('name email avatarUrl')
      .limit(50);

    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;