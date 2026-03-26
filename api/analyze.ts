import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: { code: 'CONFIG_ERROR', message: 'Gemini API key not configured' } });
  }

  const { country, state, city, address, propertyType, marketValue } = req.body || {};

  if (!country || !city) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'country and city are required' } });
  }

  const prompt = `You are a real estate liquidity analysis AI. Analyze the following property and provide a liquidity assessment.

Property Details:
- Location: ${address || ''}, ${city}, ${state || ''}, ${country}
- Property Type: ${propertyType || 'Commercial'}
- Estimated Market Value: $${marketValue ? Number(marketValue).toLocaleString() : 'Unknown'}

Provide your response as valid JSON with exactly this structure (no markdown, no code fences):
{
  "liquidityScore": <number 0-100>,
  "riskStatus": "<LOW_RISK|MEDIUM_RISK|HIGH_RISK>",
  "timeToLiquidity": <estimated days to sell, number>,
  "confidence": <0-100>,
  "assessments": [
    { "title": "<short title>", "detail": "<1-2 sentence analysis>", "sentiment": "<positive|neutral|negative>", "icon": "<check_circle|trending_up|trending_down|warning|info>" },
    { "title": "<short title>", "detail": "<1-2 sentence analysis>", "sentiment": "<positive|neutral|negative>", "icon": "<check_circle|trending_up|trending_down|warning|info>" },
    { "title": "<short title>", "detail": "<1-2 sentence analysis>", "sentiment": "<positive|neutral|negative>", "icon": "<check_circle|trending_up|trending_down|warning|info>" }
  ],
  "summary": "<2-3 sentence overall assessment>"
}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return res.status(502).json({ success: false, error: { code: 'AI_ERROR', message: 'Failed to get AI response' } });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response (strip code fences if present)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Analysis failed' } });
  }
}
