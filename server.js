const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function callGemini(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
            const rawText = parsed.candidates[0].content.parts[0].text;
            resolve(JSON.parse(rawText));
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API ROUTE 1: AI SMART COACH & NUDGES ---
  if (req.url === '/api/ai/coach' && req.method === 'POST') {
    const payload = await readRequestBody(req);
    const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || payload.geminiKey;
    const { history, target, streak, goal, isGlp, name, daysUnderTarget } = payload;

    let responseJson = null;

    if (apiKey) {
      const prompt = `You are a clinical sports nutritionist and empathetic AI Protein Coach.
Context:
- Athlete Name: ${name || 'Athlete'}
- Daily Target: ${target}g
- Current Streak: ${streak} days
- Biological Goal: ${goal || 'muscle'} (GLP-1 Medication: ${isGlp ? 'Yes' : 'No'})
- Consecutive Days Under Target: ${daysUnderTarget || 0}
- Recent Daily Totals (Past 7 Days): ${JSON.stringify(history || [])}

Generate a concise, motivating, and actionable JSON response following this exact schema:
{
  "nudgeType": "deficit_rescue" | "streak_milestone" | "glp_shield" | "morning_boost" | "goal_adjustment",
  "title": "Short punchy headline with emoji",
  "message": "2-3 sentences of empathetic coaching, explaining the science (e.g. MPS, muscle retention, TEF) and practical encouragement.",
  "suggestedFoods": [
    { "name": "Food Name (portion)", "grams": 25, "tag": "Quick Snack | High Density | Liquid" },
    { "name": "Food Name (portion)", "grams": 30, "tag": "Meal | Lean | Prep" },
    { "name": "Food Name (portion)", "grams": 20, "tag": "Dairy | Plant | Supplement" }
  ],
  "suggestGoalAdjustment": ${daysUnderTarget >= 3},
  "recommendedNewTarget": ${daysUnderTarget >= 3 ? Math.round(target * 0.85) : target},
  "adjustmentReason": "Optional short suggestion if target should be lowered or meal spread increased"
}`;
      try {
        responseJson = await callGemini(apiKey, prompt);
      } catch (e) {
        console.warn('Gemini live call error, falling back to rule engine:', e.message);
      }
    }

    // Smart Fallback Rule Engine
    if (!responseJson) {
      if (daysUnderTarget >= 3) {
        responseJson = {
          nudgeType: 'deficit_rescue',
          title: '🎯 Let\'s Reset Your Momentum',
          message: `You've been slightly below your ${target}g target for 3 days. That's completely okay! Rebuilding consistency starts with one easy high-density bridge meal today.`,
          suggestedFoods: isGlp ? [
            { name: 'Clear Whey Protein Drink', grams: 25, tag: 'Zero-Nausea Liquid' },
            { name: 'Concentrated Whey Shake', grams: 30, tag: 'High Density' },
            { name: 'Greek Yogurt (150g)', grams: 18, tag: 'Light Snack' }
          ] : [
            { name: 'Double Scoop Whey Shake', grams: 45, tag: 'Instant Catch-Up' },
            { name: 'Grilled Chicken Breast (150g)', grams: 35, tag: 'Clean Lean Meat' },
            { name: 'Tuna Can in Olive Oil', grams: 30, tag: 'Zero-Prep' }
          ],
          suggestGoalAdjustment: true,
          recommendedNewTarget: Math.round(target * 0.85),
          adjustmentReason: `Consider easing your daily goal to ${Math.round(target * 0.85)}g for a week to build an unstoppable winning streak, then scale back up.`
        };
      } else if (streak >= 3) {
        responseJson = {
          nudgeType: 'streak_milestone',
          title: `🔥 ${streak}-Day Titan Streak!`,
          message: `Incredible dedication, ${name || 'Athlete'}! Maintaining consistent daily nitrogen balance maximizes muscle protein synthesis and keeps your metabolism elevated.`,
          suggestedFoods: [
            { name: 'Post-Workout Whey', grams: 25, tag: 'Recovery' },
            { name: 'Ribeye Steak (200g)', grams: 45, tag: 'Victory Feast' },
            { name: 'Greek Yogurt + Berries', grams: 20, tag: 'Dessert Habit' }
          ],
          suggestGoalAdjustment: false
        };
      } else {
        responseJson = {
          nudgeType: 'morning_boost',
          title: '⚡ Fuel Your Next Muscle Window',
          message: `Every 25-30g protein dose triggers a 3-hour muscle protein synthesis window. Fuel up now to keep energy steady and avoid afternoon slumps.`,
          suggestedFoods: [
            { name: '4 Whole Eggs + Toast', grams: 24, tag: 'Power Breakfast' },
            { name: 'Greek Yogurt Bowl', grams: 20, tag: 'Quick Breakfast' },
            { name: 'Morning Whey Shake', grams: 25, tag: 'Fast Fuel' }
          ],
          suggestGoalAdjustment: false
        };
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify(responseJson));
    return;
  }

  // --- API ROUTE 2: AI WEEKLY & MONTHLY REFLECTION REPORT ---
  if (req.url === '/api/ai/report' && req.method === 'POST') {
    const payload = await readRequestBody(req);
    const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || payload.geminiKey;
    const { period, history, target, streak, goal, isGlp, name, avgProtein, hitRate } = payload;

    let reportJson = null;

    if (apiKey) {
      const prompt = `You are a world-class sports science AI generating an official ${period === 'monthly' ? 'Monthly' : 'Weekly'} Protein & Habit Reflection Report.
Athlete Profile:
- Name: ${name || 'Athlete'}
- Period: ${period === 'monthly' ? 'Past 30 Days' : 'Past 7 Days'}
- Daily Target: ${target}g
- Average Daily Protein: ${avgProtein}g
- Goal Hit Rate: ${hitRate}%
- Active Streak: ${streak} days
- Biological Objective: ${goal || 'muscle'} (GLP-1: ${isGlp ? 'Yes' : 'No'})
- Daily Log Records: ${JSON.stringify(history || [])}

Generate a comprehensive, scientifically grounded, and inspiring JSON report following this schema:
{
  "periodType": "${period}",
  "grade": "A+" | "A" | "B+" | "B" | "C",
  "aiSummary": "3-4 detailed sentences analyzing their consistency, macronutrient trends, physiological benefits gained (e.g., nitrogen balance, leucine threshold, muscle retention), and praise for their dedication.",
  "keyWins": [
    "Highlight #1 (e.g. Best single day intake)",
    "Highlight #2 (e.g. Morning habit adherence or streak milestone)",
    "Highlight #3 (e.g. Consistency over weekends)"
  ],
  "focusAreas": [
    "Specific improvement area #1",
    "Specific improvement area #2"
  ],
  "recommendedGoalAdjustment": "Optional suggestion if target should be adjusted or kept as-is"
}`;
      try {
        reportJson = await callGemini(apiKey, prompt);
      } catch (e) {
        console.warn('Gemini report generation error:', e.message);
      }
    }

    // Smart Fallback Report Generator
    if (!reportJson) {
      const grade = hitRate >= 85 ? 'A+' : (hitRate >= 70 ? 'A' : (hitRate >= 50 ? 'B' : 'C+'));
      reportJson = {
        periodType: period,
        grade: grade,
        aiSummary: `Over the past ${period === 'monthly' ? '30 days' : '7 days'}, you logged an average of ${avgProtein}g of protein daily, achieving a ${hitRate}% goal hit rate. Your steady intake has supported muscle protein synthesis (MPS) and protected lean body mass against catabolic breakdown.`,
        keyWins: [
          `Achieved an average of ${avgProtein}g protein daily against your ${target}g goal.`,
          `Maintained an active streak of ${streak} days with solid tracking discipline.`,
          `Consistently logged multiple feedings to maintain the leucine trigger.`
        ],
        focusAreas: [
          `Aim to front-load at least 30g protein before 11:00 AM to eliminate evening catch-up pressure.`,
          `Keep high-protein grab-and-go options (Greek yogurt, jerky, clear whey) stocked for busy days.`
        ],
        recommendedGoalAdjustment: hitRate >= 85 
          ? `Your current ${target}g target is dialed in perfectly. Keep crushing this baseline!`
          : `Maintain your ${target}g target and focus on closing the daily gap with 1-tap smart bridges.`
      };
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify(reportJson));
    return;
  }

  // --- STATIC FILE SERVING ---
  let reqPath = req.url === '/' ? '/index.html' : req.url;
  reqPath = reqPath.split('?')[0];

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/ with AI Coaching Endpoints active.`);
});
