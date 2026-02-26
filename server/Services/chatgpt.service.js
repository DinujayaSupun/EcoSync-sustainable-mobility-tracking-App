const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.generateChallengeContent = async (params) => {

  const prompt = `
  Create a sustainability commuting challenge.

  Transport mode: ${params.transportMode}
  Emission reduction target: ${params.emissionTarget} kg CO2
  Duration: ${params.durationDays} days
  Difficulty: ${params.difficulty}
  Type: ${params.type}

  Return JSON with:
  - title
  - tagline
  - description
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.choices[0].message.content);
};