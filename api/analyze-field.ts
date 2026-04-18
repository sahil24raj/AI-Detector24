import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  // Groq vision-capable models (in priority order)
  const MODELS = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
  ];

  try {
    const { fieldImageBase64, fieldImageMimeType, language = 'en' } = req.body;

    if (!fieldImageBase64 || !fieldImageMimeType) {
      return res.status(400).json({ error: 'fieldImageBase64 and fieldImageMimeType are required' });
    }

    const prompt = `You are an Advanced AI Field Analyzer with Smart Zoning capability.
Your goal: Divide the field into zones and give optimized treatment plan for each zone.

FIELD IMAGE ANALYSIS & PRECISION FARMING:
Analyze the provided field image and follow these detailed steps:

STEP 1: FIELD SEGMENTATION
Divide the field into 3-5 logical zones (A, B, C...).
Identify Condition: Healthy, Mild Infection, Severe Infection.

STEP 2: ZONE-WISE ANALYSIS
For each zone, identify Infection level and Possible issue (Disease, Water stress, Nutrient issue).

STEP 3: ZONE MAP (MINIMAP)
Create a 3x3 grid using emojis: 🟩 Healthy, 🟨 Mild issue, 🟥 Severe.

STEP 4: PRIORITY SYSTEM
Assign Priority: High → Severe zones, Medium → Mild zones, Low → Healthy zones.

STEP 5: ZONE-WISE ACTION PLAN
Provide a specific action for each zone (e.g., Monitoring, Mild treatment, Strong treatment).

STEP 6: TREATMENT OPTIMIZATION
Decide on Spot treatment OR full field treatment. Estimate % field needing treatment.

STEP 7: RESOURCE SAVING INSIGHT
Estimate Chemical saving %, Water saving %, and Cost saving in Rupees (₹).

STEP 8: FINAL REPORT SUMMARY
Determine Overall field condition (Good/Moderate/Poor) and Total affected %.

STEP 9: FINANCIAL DATA (MANDATORY)
Estimate the "expected_profit_per_sqft" in Rupees (₹) based on the current field condition, crop type, and regional market data for India/South Asia.

STRICT JSON OUTPUT FORMAT:
You MUST entirely translate ALL string VALUES inside this JSON into the language code "${language}". ONLY the exact JSON keys must remain in English.

{
  "crop": "[Crop Name] 🌱",
  "field_health": {
    "overall_condition": "Overall Condition (Good/Moderate/Poor)",
    "total_affected_percent": "Affected %"
  },
  "minimap": {
    "grid": [["🟩", "🟨", "🟥"], ["🟩", "🟩", "🟨"], ["🟩", "🟩", "🟩"]],
    "location_desc": "Directional description of infection"
  },
  "zone_analysis": [
    { "id": "A", "condition": "Condition Name", "issue": "Detected Issue", "action": "Step-by-step Action" }
  ],
  "priority_plan": {
    "high": "Zone IDs",
    "medium": "Zone IDs",
    "low": "Zone IDs"
  },
  "treatment_strategy": {
    "type": "Spot / Full field",
    "area_to_treat_percent": "35%",
    "short_instruction": "One-line final instruction"
  },
  "savings_insight": {
    "chemical_saved_percent": "35%",
    "water_saved_percent": "20%",
    "cost_saved_rupees": "₹XXXX",
    "expected_profit_per_sqft": "₹XX.XX"
  }
}

Return ONLY valid JSON.`;

    const requestBody = {
      model: MODELS[0],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${fieldImageMimeType};base64,${fieldImageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    };

    let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Fallback to secondary model on rate limit or server error
    if (!response.ok && (response.status === 429 || response.status >= 500)) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
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

    // Server-side delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const result = JSON.parse(cleanContent);
      return res.status(200).json(result);
    } catch {
      try {
        const fallbackResult = JSON.parse(rawContent.replace(/```json/g, '').replace(/```/g, '').trim());
        return res.status(200).json(fallbackResult);
      } catch {
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }
    }
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message || 'Internal server error' });
  }
}
