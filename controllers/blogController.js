const { supabase } = require('../services/supabaseClient');
const logger = require('../utils/logger');
const { publishPendingBlogs } = require('../blog/blogScheduler');

// Create new blog
exports.createBlog = async (req, res) => {
  const { title, slug, tags, content_markdown, content_html, image_prompts, image_urls } = req.body;

  if (!title || !slug || !content_markdown) {
    return res.status(400).json({ error: 'Missing required fields: title, slug, content_markdown' });
  }

  try {
    const { error } = await supabase.from('blogs').insert({
      title,
      slug,
      tags,
      content_markdown,
      content_html,
      image_prompts,
      image_urls,
    });

    if (error) throw error;
    res.status(201).json({ message: 'Blog created successfully' });
  } catch (err) {
    logger.error(`[CREATE_BLOG] ${err.message}`);
    res.status(500).json({ error: 'Failed to create blog', detail: err.message });
  }
};

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error(`[GET_BLOGS] ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Get a single blog by ID
exports.getBlogById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error(`[GET_BLOG_BY_ID] ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

// Update blog by ID
exports.updateBlog = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { error } = await supabase.from('blogs').update(updates).eq('id', id);
    if (error) throw error;
    res.json({ message: 'Blog updated successfully' });
  } catch (err) {
    logger.error(`[UPDATE_BLOG] ${err.message}`);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

// Delete blog by ID
exports.deleteBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    logger.error(`[DELETE_BLOG] ${err.message}`);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

// POST /blog/publish-now
exports.publishNow = async (req, res) => {
  try {
    await publishPendingBlogs();
    res.json({ message: 'Blog publishing job triggered manually' });
  } catch (err) {
    logger.error(`[BLOG_MANUAL_TRIGGER] ${err.stack}`);
    res.status(500).json({ error: 'Manual blog publish failed', detail: err.message });
  }
};

