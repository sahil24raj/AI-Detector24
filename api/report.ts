import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  try {
    const { imageBase64, mimeType, cropData } = req.body;

    if (!imageBase64 || !mimeType || !cropData) {
      return res.status(400).json({ error: 'imageBase64, mimeType, and cropData are required' });
    }

    const prompt = `You are an advanced Agri-AI assistant. Based on this crop image and the confirmed details below, generate a detailed full report.

Confirmed Details:
- Crop Type: ${cropData.crop_type}
- Soil Type: ${cropData.soil_type}
- Temperature: ${cropData.temperature}

Generate a comprehensive JSON report with these exact fields:
{
  "analysis": {
    "crop_type": "${cropData.crop_type}",
    "soil_type": "${cropData.soil_type}",
    "temperature": "${cropData.temperature}",
    "confidence": "${cropData.confidence}"
  },
  "health": {
    "crop_health_score": (0-100 overall health),
    "nutrition_score": (0-100 nutrition level),
    "water_score": (0-100 water adequacy),
    "disease_risk": (0-100 disease risk level, higher = more risk),
    "mineral_deficiency": {
      "Nitrogen": (0-100 deficiency level, higher = more deficient),
      "Phosphorus": (0-100),
      "Potassium": (0-100)
    }
  },
  "insights": {
    "what_is_good": "Simple explanation of what looks good about this crop",
    "what_is_wrong": "Simple explanation of what problems are visible",
    "why_scores": "Simple explanation of why scores are high or low"
  },
  "solutions": {
    "gharelu_nuske": ["home remedy 1", "home remedy 2", "home remedy 3"],
    "recommended_fertilizers": ["fertilizer 1 with dosage", "fertilizer 2 with dosage"],
    "watering_suggestions": ["suggestion 1", "suggestion 2"],
    "disease_treatment": ["treatment 1 if any disease risk", "treatment 2"],
    "action_plan": [
      "Step 1: ...",
      "Step 2: ...",
      "Step 3: ...",
      "Step 4: ...",
      "Step 5: ..."
    ]
  }
}

Keep language simple and farmer-friendly. Be practical and actionable. Return ONLY valid JSON.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an advanced Agri-AI assistant. Always respond with valid JSON only, no extra text or markdown.',
          },
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
        max_tokens: 2048,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err?.error?.message || 'Groq API error' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    return res.status(200).json(JSON.parse(content));
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message || 'Internal server error' });
  }
}
