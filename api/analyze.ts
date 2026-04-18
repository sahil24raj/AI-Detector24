import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  const MODELS = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
  ];

  try {
    const { imageBase64, mimeType, location, language = 'en' } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'imageBase64 and mimeType are required' });
    }

    const prompt = `You are an elite Agri-AI vision expert and plant pathologist with 30+ years of experience.
Analyze this crop image with extreme precision and scientific depth.
${location ? `LOCATION CONTEXT: The farm is located near "${location}". Factor in local climate zones, monsoon patterns, regional soil profiles, common local pests, and typical crops grown in this region.` : ''}

PERFORM A THOROUGH VISUAL INSPECTION AND RETURN THE FOLLOWING:

1. CROP IDENTIFICATION — Identify the exact crop species and variety if possible.
2. DISEASE / PEST — Identify disease or pest by scientific name if possible. If healthy, write "None".
3. GROWTH STAGE — Identify the phenological stage (e.g., seedling, vegetative, flowering, grain fill, harvest-ready).
4. VISUAL SYMPTOMS — List all visible symptoms on leaves, stems, roots, and fruit if visible.
5. NUTRIENT STATUS — Identify visible nutrient deficiencies or toxicities (N, P, K, Fe, Mg, Ca, etc.).
6. AFFECTED AREA — Visual estimate of % crop area showing damage.
7. SOIL TYPE — Estimate from visual cues (color, texture, clumping, moisture retention).
8. ESTIMATED TEMPERATURE — Based on plant stress indicators, environment, and region.
9. CONFIDENCE SCORE — Your overall confidence in this analysis (0-100%).
10. URGENCY LEVEL — "Immediate", "Within 3 days", "Within a week", "Monitor only".
11. QUICK TIP — One actionable sentence the farmer should do RIGHT NOW.
12. MARKET IMPACT — Brief estimate of how this condition will affect crop sale price/yield.

CRITICAL LANGUAGE RULE:
ALL string VALUES must be completely translated into language code: "${language}".
ONLY keep the JSON keys in English. Return ONLY valid JSON — no markdown, no explanation.

{
  "crop_type": "Full crop name and variety",
  "scientific_name": "Latin name of crop or disease",
  "growth_stage": "Current phenological stage",
  "disease": "Disease/pest name (None if healthy)",
  "disease_scientific": "Scientific name of disease/pest (None if healthy)",
  "visual_symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "nutrient_issues": ["deficiency or toxicity observed, e.g., Nitrogen deficiency - yellowing lower leaves"],
  "affected_area": "XX%",
  "soil_type": "Soil type with brief description",
  "temperature": "Estimated range e.g. 28-34°C",
  "urgency": "Immediate / Within 3 days / Within a week / Monitor only",
  "quick_tip": "One immediate action the farmer must take",
  "market_impact": "Brief impact on yield or sale price",
  "confidence": "XX%"
}`;

    const requestBody = {
      model: MODELS[0],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    };

    let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok && (response.status === 429 || response.status >= 500)) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ ...requestBody, model: MODELS[1] }),
      });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: (err as any)?.error?.message || `Groq API error (${response.status})`,
      });
    }

    const data = await response.json() as any;
    const rawContent = data.choices?.[0]?.message?.content || '{}';

    let cleanContent = rawContent.trim();
    if (cleanContent.includes('```json')) {
      cleanContent = cleanContent.split('```json')[1].split('```')[0].trim();
    } else if (cleanContent.includes('```')) {
      cleanContent = cleanContent.split('```')[1].split('```')[0].trim();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      return res.status(200).json(JSON.parse(cleanContent));
    } catch {
      try {
        return res.status(200).json(JSON.parse(rawContent.replace(/```json/g, '').replace(/```/g, '').trim()));
      } catch {
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }
    }
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message || 'Internal server error' });
  }
}
