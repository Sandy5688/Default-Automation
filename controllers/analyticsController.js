const { supabase } = require('../services/supabaseClient');
const logger = require('../utils/logger');

// 📊 1. Engagement stats per platform
exports.getEngagementStats = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_platform_engagement_stats');
    if (error) throw error;
    res.json({ platforms: data });
  } catch (err) {
    logger.error(`[ANALYTICS] Engagement stats error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch engagement stats' });
  }
};

// 🪙 2. Reward breakdown by type
exports.getRewardStats = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_reward_stats_by_type');
    if (error) throw error;
    res.json(data); // Return array directly
  } catch (err) {
    logger.error(`[ANALYTICS] Reward stats error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch reward stats' });
  }
};

// 🧑‍💼 3. Top users by total engagement
exports.getTopUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('top_engaged_users');
    if (error) throw error;
    res.json({ top_users: data });
  } catch (err) {
    logger.error(`[ANALYTICS] Top users error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch top users' });
  }
};
// 🎁 4. Full reward list
exports.getAllRewards = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('issued_at', { ascending: false });

    if (error) throw error;
    res.json({ rewards: data });
  } catch (err) {
    logger.error(`[ANALYTICS] Fetch all rewards error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch all rewards' });
  }
};
