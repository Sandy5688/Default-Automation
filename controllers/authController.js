const User = require('../models/User');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');
const { triggerTrap } = require('../traps/magicLoginTrap');

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    res.status(201).json({ message: 'User created', user: { id: user._id, name, email } });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    user.lastActive = new Date();
    await user.save();
    res.json({ message: 'Login successful', user: { id: user._id, name: user.name, email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.sendMagic = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const token = generateToken(24);
    user.magicToken = token;
    user.magicTokenExpires = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    await user.save();
    // In real app, email the link. Here, just return it.
    res.json({ magicLink: `/auth/magic/${token}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate magic link' });
  }
};

exports.magicLogin = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ magicToken: token, magicTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
    user.lastActive = new Date();
    user.magicToken = undefined;
    user.magicTokenExpires = undefined;
    await user.save();
    // Trigger trap via Axios
    await triggerTrap(user.email, 'magic-login');
    res.json({ message: 'Magic login successful', user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Magic login failed' });
  }
};

exports.deleteInactive = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // 30 days
    const result = await User.deleteMany({ lastActive: { $lt: cutoff } });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete inactive users' });
  }
};
