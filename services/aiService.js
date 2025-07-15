const fallbackPrompts = require('./fallbackPrompts'); // ✅ Add this line
const { supabase } = require('./supabaseClient');
const { openai } = require('./openaiClient');
const logger = require('../utils/logger'); // optional if using logger



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


module.exports = { generateCaption }; 
