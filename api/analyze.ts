import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY not set' });
  }

  try {
    const { country, state, city, address, propertyType, marketValue } = req.body || {};

    if (!city) {
      return res.status(400).json({ success: false, error: 'city is required' });
    }

    const prompt = `You are a real estate liquidity analysis AI. Analyze the following property and provide a liquidity assessment.

Property Details:
- Location: ${address || ''}, ${city}, ${state || ''}, ${country || ''}
- Property Type: ${propertyType || 'Commercial'}
- Estimated Market Value: $${marketValue ? Number(marketValue).toLocaleString() : '50,000,000'}

Respond ONLY with valid JSON, no markdown fences:
{
  "liquidityScore": <number 0-100>,
  "riskStatus": "<LOW_RISK|MEDIUM_RISK|HIGH_RISK>",
  "timeToLiquidity": <estimated days to sell>,
  "confidence": <0-100>,
  "assessments": [
    { "title": "<title>", "detail": "<1-2 sentences>", "sentiment": "<positive|neutral|negative>", "icon": "<check_circle|trending_up|trending_down|warning|info>" },
    { "title": "<title>", "detail": "<1-2 sentences>", "sentiment": "<positive|neutral|negative>", "icon": "<check_circle|trending_up|trending_down|warning|info>" },
    { "title": "<title>", "detail": "<1-2 sentences>", "sentiment": "<positive|neutral|negative>", "icon": "<check_circle|trending_up|trending_down|warning|info>" }
  ],
  "summary": "<2-3 sentence overall assessment>"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', response.status, errText);
      return res.status(502).json({ success: false, error: 'Failed to get AI response' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    console.error('Analyze error:', err?.message || err);
    return res.status(500).json({ success: false, error: 'Analysis failed: ' + (err?.message || 'unknown') });
  }
}
