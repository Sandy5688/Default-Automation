const fallbackPrompts = require('./fallbackPrompts'); 
const { supabase } = require('./supabaseClient');
const { openai } = require('./openaiClient');
const logger = require('../utils/logger'); 



async function generateCaption(prompt, platform) {
  const platformFallback = fallbackPrompts[platform];
  const finalPrompt =
    (prompt || '').trim() || platformFallback || fallbackPrompts.default;

  if (!finalPrompt) {
    logger.error(`[AI] No valid prompt for platform: ${platform}`);
    throw new Error('Missing prompt and fallback');
  }

  try {
    const { data: cached } = await supabase
      .from('ai_outputs')
      .select('output')
      .eq('prompt', finalPrompt)
      .eq('platform', platform)
      .limit(1)
      .maybeSingle();

    if (cached?.output) {
      logger.info(`[AI_CACHE] Used cached caption`);
      return cached.output;
    }
  } catch (err) {
    logger.error(`[AI_CACHE] Cache error: ${err.message}`);
  }

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: finalPrompt }],
      temperature: 0.7,
    });

    const caption = aiResponse?.choices?.[0]?.message?.content?.trim();
    if (!caption) throw new Error('AI response is empty');

    await supabase.from('ai_outputs').insert({
      platform,
      prompt: finalPrompt,
      output: caption,
    });

    return caption;
  } catch (err) {
    logger.error(`[AI_GENERATE] Error generating caption: ${err.message}`);
    throw new Error('AI caption generation failed');
  }
}


async function generateBlogContent(titleOrPrompt, tags = []) {
  const finalPrompt = (titleOrPrompt || '').trim() || fallbackPrompts.default;

  if (!finalPrompt) {
    logger.error(`[BLOG_AI] No valid blog prompt`);
    throw new Error('Missing blog prompt');
  }

  // Check cache first
  try {
    const { data: cached } = await supabase
      .from('ai_outputs')
      .select('output')
      .eq('prompt', finalPrompt)
      .eq('platform', 'blog')
      .limit(1)
      .maybeSingle();

    if (cached?.output) {
      logger.info(`[BLOG_CACHE] Used cached blog content`);
      return JSON.parse(cached.output);
    }
  } catch (err) {
    logger.warn(`[BLOG_CACHE] Cache lookup error: ${err.message}`);
  }

  try {
    const messages = [
      {
        role: 'system',
        content: `You are an expert SEO blogger. Write a full blog post in markdown based on the user's topic. Include headings, subheadings, and make it structured, informative, and engaging.`,
      },
      {
        role: 'user',
        content: `Write a blog post about: "${finalPrompt}"`,
      },
    ];

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.75,
    });

    const markdownContent = aiResponse?.choices?.[0]?.message?.content?.trim();
    if (!markdownContent) throw new Error('AI did not return content');

    // Convert markdown to HTML (optional, or defer to frontend)
    const contentHtml = markdownToHtml(markdownContent);

    const output = {
      title: finalPrompt,
      content_markdown: markdownContent,
      content_html: contentHtml,
      tags,
    };

    // Save to ai_outputs for caching
    await supabase.from('ai_outputs').insert({
      platform: 'blog',
      prompt: finalPrompt,
      output: JSON.stringify(output),
    });

    return output;
  } catch (err) {
    logger.error(`[BLOG_AI] Blog generation failed: ${err.message}`);
    throw new Error('Blog content generation failed');
  }
}

// Utility: Convert Markdown → HTML
const marked = require('marked');

function markdownToHtml(markdown) {
  if (typeof markdown !== 'string') {
    markdown = markdown?.content || markdown?.text || JSON.stringify(markdown); 
  }
  return marked.parse(markdown);
}

module.exports = { generateCaption, generateBlogContent, markdownToHtml }; 
