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
    const { fieldImageBase64, fieldImageMimeType, language = 'en' } = req.body;

    if (!fieldImageBase64 || !fieldImageMimeType) {
      return res.status(400).json({ error: 'fieldImageBase64 and fieldImageMimeType are required' });
    }

    const prompt = `You are an elite Precision Agriculture AI and Remote Sensing Specialist with deep expertise in Indian farming systems, crop science, and satellite-grade field analysis.

You are analyzing a field-level crop image (aerial/drone/ground view). Perform the most advanced precision farming analysis possible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIELD ANALYSIS PROTOCOL (15 steps):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: CROP IDENTIFICATION
Identify the crop species, estimated variety, and current growth stage.

STEP 2: FIELD SEGMENTATION
Divide the field into 3-6 logical zones (A, B, C...) based on visible color variation, density, and health pattern.
For each zone, determine: condition, estimated size percentage, primary issue, severity.

STEP 3: DETAILED ZONE ANALYSIS
For each zone:
— Infection type (Fungal/Bacterial/Viral/Pest/Abiotic/Nutrient)
— Visible symptoms (color, texture, wilting, spotting)
— Root probable cause
— Recommended action (specific product + dose if applicable)

STEP 4: ZONE MINIMAP (3x3 emoji grid)
🟩 = Healthy | 🟨 = Mild Issue | 🟥 = Severe Issue
Map the field's condition spatially.

STEP 5: PRIORITY RANKING
Rank zones: High Priority (treat immediately) → Medium → Low (monitor only).

STEP 6: TREATMENT STRATEGY
Spot treatment vs full-field? Exact % of field to spray. Estimated cost in ₹/acre.

STEP 7: SPRAY PLAN
Provide a 4-stage spray calendar: Day 1, Day 4, Day 8, Day 15.
Include product name, dose/acre, dilution, timing (morning/evening), weather condition required.

STEP 8: NUTRIENT ZONING
Identify which zones show nutrient deficiency signs (yellowing = N, purple = P, brown tips = K, etc.)
Recommend fertilizer type, quantity per acre, and application method per zone.

STEP 9: IRRIGATION ZONING
Which zones are water-stressed or waterlogged?
Recommend irrigation schedule: method, quantity, frequency.

STEP 10: RESOURCE OPTIMIZATION
Chemical saving %, Water saving %, Labor saving %, Total cost saving in ₹.

STEP 11: FINANCIAL PROJECTIONS
— Current estimated yield (quintals/acre)
— Yield loss % from detected issues
— Revenue at current mandi price (₹/quintal)
— Revenue after treatment
— Return on treatment investment (ROI %)
— Expected profit per sq ft (₹)

STEP 12: SOIL HEALTH ZONING
Estimate soil carbon, compaction zones, drainage quality per area.

STEP 13: RISK & SPREAD ANALYSIS
Will the infection spread? Timeline and direction of spread if uncontrolled.

STEP 14: ENVIRONMENTAL SUSTAINABILITY SCORE
Rate the field's farming practices: soil conservation, water efficiency, chemical load — out of 100.

STEP 15: FARMER'S PRIORITY ACTION LIST
5 specific actions ranked by urgency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL LANGUAGE RULE:
Translate ALL string VALUES into language code: "${language}".
ONLY JSON keys remain in English. Return ONLY valid JSON. No markdown.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "crop": "Crop name and variety 🌱",
  "growth_stage": "Current growth stage",
  "field_health": {
    "overall_condition": "Good/Moderate/Poor",
    "total_affected_percent": "XX%",
    "healthy_percent": "XX%",
    "mild_issue_percent": "XX%",
    "severe_issue_percent": "XX%"
  },
  "minimap": {
    "grid": [["🟩","🟨","🟥"],["🟩","🟩","🟨"],["🟩","🟩","🟩"]],
    "location_desc": "Infection concentrated in north-east quadrant, spreading south"
  },
  "zone_analysis": [
    {
      "id": "A",
      "field_percent": "XX%",
      "condition": "Healthy/Mild/Severe",
      "infection_type": "Fungal/Bacterial/Pest/Nutrient/Abiotic",
      "symptoms": ["symptom 1", "symptom 2"],
      "root_cause": "Core scientific reason",
      "priority": "High/Medium/Low",
      "action": "Specific treatment with product and dose",
      "estimated_cost_inr": "₹XXX per acre"
    }
  ],
  "priority_plan": {
    "high": "Zone IDs — treat within 24 hours",
    "medium": "Zone IDs — treat within 3 days",
    "low": "Zone IDs — monitor weekly"
  },
  "spray_schedule": [
    { "day": "Day 1", "zone": "A, B", "product": "...", "dose_per_acre": "...", "dilution": "...", "timing": "Early morning", "weather": "No rain, below 32°C" },
    { "day": "Day 4", "zone": "...", "product": "...", "dose_per_acre": "...", "dilution": "...", "timing": "...", "weather": "..." },
    { "day": "Day 8", "zone": "...", "product": "...", "dose_per_acre": "...", "dilution": "...", "timing": "...", "weather": "..." },
    { "day": "Day 15", "zone": "...", "product": "...", "dose_per_acre": "...", "dilution": "...", "timing": "...", "weather": "..." }
  ],
  "nutrient_zoning": [
    { "zone": "A", "deficiency": "Nitrogen", "symptom": "Yellowing leaves", "fix": "Urea 25kg/acre, broadcast" }
  ],
  "irrigation_plan": {
    "stressed_zones": "Zone IDs",
    "waterlogged_zones": "Zone IDs",
    "method": "Drip/Flood/Sprinkler",
    "quantity_liters_per_acre": "...",
    "frequency": "...",
    "schedule": "..."
  },
  "treatment_strategy": {
    "type": "Spot / Full field",
    "area_to_treat_percent": "XX%",
    "estimated_spray_cost_inr": "₹XXXX per acre",
    "short_instruction": "One-line priority instruction"
  },
  "savings_insight": {
    "chemical_saved_percent": "XX%",
    "water_saved_percent": "XX%",
    "labor_saved_percent": "XX%",
    "total_cost_saved_inr": "₹XXXX"
  },
  "financial_projections": {
    "estimated_yield_quintals_per_acre": "XX",
    "yield_loss_percent": "XX%",
    "current_mandi_price_per_quintal_inr": "₹XXXX",
    "revenue_without_treatment_inr": "₹XXXX per acre",
    "revenue_after_treatment_inr": "₹XXXX per acre",
    "treatment_cost_inr": "₹XXXX per acre",
    "net_gain_from_treatment_inr": "₹XXXX per acre",
    "roi_percent": "XX%",
    "expected_profit_per_sqft": "₹XX.XX"
  },
  "soil_health_zoning": {
    "carbon_level": "Low/Medium/High",
    "compaction_zones": "Zone IDs or None",
    "drainage_quality": "Poor/Medium/Good",
    "amendment_needed": "Compost 2 tons/acre, Gypsum 200kg/acre, etc."
  },
  "risk_propagation": {
    "will_spread": "Yes/No",
    "spread_direction": "North-east towards Zone C",
    "spread_timeline": "3-5 days if uncontrolled",
    "spread_mechanism": "Wind/Water/Contact/Insects"
  },
  "sustainability_score": {
    "score": 0,
    "soil_conservation": "Comment",
    "water_efficiency": "Comment",
    "chemical_load": "High/Medium/Low",
    "improvement_tips": ["Tip 1", "Tip 2"]
  },
  "farmer_checklist": [
    "1. Immediate action 1",
    "2. Action 2",
    "3. Action 3",
    "4. Action 4",
    "5. Action 5"
  ]
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
              image_url: { url: `data:${fieldImageMimeType};base64,${fieldImageBase64}` },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 8000,
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
