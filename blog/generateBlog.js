const { OpenAI } = require('openai');
const { supabase } = require('../services/supabaseClient');
const { uploadImage } = require('./imageGenerator');
const { slugify } = require('../utils/slugify');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateBlog = async (topic) => {
  const systemPrompt = `
You are a professional SEO copywriter.
Write a full-length blog post on: "${topic}".
Include:
- Catchy title
- 4-6 H2 sections
- bullet points
- SEO tags
- Insert [IMAGE: prompt] placeholders after intro and 1-2 sections
Format as Markdown.
`;

  const aiRes = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'system', content: systemPrompt }],
    temperature: 0.8,
  });

  const markdown = aiRes.choices?.[0]?.message?.content;
  if (!markdown) throw new Error('GPT returned no content');

  const titleMatch = markdown.match(/^#\s+(.*)/);
  const title = titleMatch?.[1]?.trim() || 'Untitled Blog';
  const slug = slugify(title);
  const imagePrompts = [...markdown.matchAll(/\[IMAGE:\s*(.*?)\]/g)].map((m) => m[1]);

  const imageUrls = [];
  for (const prompt of imagePrompts) {
    const url = await uploadImage(prompt); // DALL·E or Midjourney
    imageUrls.push(url);
  }

  const html = markdown
    .replace(/^#\s+(.*)/, '<h1>$1</h1>')
    .replace(/\n##\s+(.*)/g, '<h2>$1</h2>')
    .replace(/\[IMAGE:\s*(.*?)\]/g, (_, p) => {
      const idx = imagePrompts.indexOf(p);
      return imageUrls[idx] ? `<img src="${imageUrls[idx]}" alt="${p}" />` : '';
    });

  const { error } = await supabase.from('blogs').insert({
    title,
    slug,
    tags: topic.split(','),
    content_markdown: markdown,
    content_html: html,
    image_prompts: imagePrompts,
    image_urls: imageUrls,
  });

  if (error) throw error;
  return { title, slug, imageUrls };
};

module.exports = { generateBlog };
