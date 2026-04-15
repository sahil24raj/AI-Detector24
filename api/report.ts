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
    const { imageBase64, mimeType, cropData, location, weather, language = 'en' } = req.body;

    if (!imageBase64 || !mimeType || !cropData) {
      return res.status(400).json({ error: 'imageBase64, mimeType, and cropData are required' });
    }

    const prompt = `You are an Advanced AI Crop Health Assistant designed to solve real farmer problems.
Your goal is NOT just detection, but complete diagnosis + action plan + prediction.

INPUT FORMAT:
{
  "crop": "${cropData.crop_type}",
  "disease": "${cropData.disease || 'Unknown'}",
  "confidence": "${cropData.confidence}",
  "affected_area": "${cropData.affected_area || 'Unknown'}",
  "temperature": "${weather?.temp ? weather.temp + '°C' : cropData.temperature}",
  "humidity": "${weather?.humidity ? weather.humidity + '%' : 'Unknown'}",
  "rainfall": "${weather?.rainfall ? weather.rainfall + 'mm' : 'Unknown'}",
  "location": "${location || 'Unknown'}",
  "images_count": "1"
}

STEP 1: VALIDATION & CONFIDENCE
- If confidence < 80%, mention uncertainty
- If images_count < 2: Suggest uploading multiple images for better accuracy
- If images_count >= 2: Increase reliability of result

STEP 2: CROP STAGE DETECTION
- Identify growth stage: Seedling, Vegetative, Flowering, or Maturity.
- Also mention whether detected issue is normal or abnormal at this stage.

STEP 3: DISEASE & PEST ANALYSIS
- Name disease (if present)
- Severity based on affected_area: 0-20% = Low, 21-50% = Medium, 51-100% = High
- Spread Risk: Low / Medium / High
- If no disease: Say "No major disease detected"

STEP 4: ENVIRONMENT ANALYSIS
- Compare temperature, humidity, rainfall with ideal crop conditions.
- Detect: Heat stress, Cold stress, Excess humidity / dryness.

STEP 5: SOIL & NUTRIENT ANALYSIS
- Estimate soil type using location.
- Detect deficiencies: Nitrogen (yellow leaves), Phosphorus (slow growth), Potassium (leaf edge burn).

STEP 6: WATER ANALYSIS
- Use rainfall + temperature: Low rainfall + high temp = Underwatering, High rainfall = Overwatering risk.

STEP 7: IRRIGATION TIMING (VERY IMPORTANT)
- Recommend best irrigation time based on weather.

STEP 8: EARLY WARNING SYSTEM
- Predict possible upcoming risks based on weather and current state.

STEP 9: SIMILAR CASE SOLUTION
- Provide what most farmers do in similar cases. Keep realistic (use common solutions).

STEP 10: SEVERITY ACTION PLAN (STEP-BY-STEP)
- If disease present: Day 1-2 (Immediate action), Day 3-5 (Treatment), Day 7+ (Monitoring).

STEP 11: HEALTH SCORE CALCULATION
Calculate (0-100): Leaf Health, Soil Health, Water, Environment, Disease Impact.
Final Score = (Leaf*0.30) + (Soil*0.20) + (Water*0.20) + (Environment*0.15) + (Disease*0.15).
Classify: 80-100 Healthy, 50-79 Moderate, <50 Critical.

STEP 12: ISSUE IDENTIFICATION
- List clearly: Nutrient, Water, Env stress, Disease

STEP 13: SMART RECOMMENDATIONS
- Provide organic solutions, fertilizers, irrigation advice, pest control, preventive steps.

STEP 14: FINAL OUTPUT FORMAT (STRICT)
Generate a comprehensive JSON report containing EXACTLY these fields reflecting your 14-step reasoning:
IMPORTANT INSTRUCTION: Translate all string VALUES inside the JSON into the language code "${language}". Keep the EXACT JSON keys in English.
{
  "crop": "[Crop Name] 🌱",
  "stage": "[Predicted Stage] + (Normal/Abnormal)",
  "health_score": [0-100 number],
  "metrics": {
    "leaf_health": [0-100 number],
    "soil_health": [0-100 number],
    "water_score": [0-100 number],
    "environment_score": [0-100 number],
    "disease_impact": [0-100 number]
  },
  "issues_detected": ["issue 1", "issue 2"],
  "disease_pest": {
    "name": "...",
    "severity": "...",
    "spread_risk": "..."
  },
  "analysis": {
    "environment": "Short explanation...",
    "water": "Status + reason...",
    "soil": "Type + deficiencies..."
  },
  "recommendations": [
    "📝 Organic / Gharelu: ...",
    "🧪 Fertilizer: ...",
    "💧 Irrigation: ...",
    "🛡️ Pest Control: ...",
    "🛑 Preventive: ..."
  ],
  "irrigation_advice": "Best time + reason",
  "early_warning": "Future risk prediction",
  "similar_case": "What other farmers did",
  "action_plan": {
    "day_1_2": "...",
    "day_3_5": "...",
    "day_7_plus": "..."
  }
}

Keep language simple and farmer-friendly in the target language. Do not hallucinate unknown diseases. Return ONLY valid JSON.`;

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
