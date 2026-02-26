const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.generateChallengeContent = async (params) => {

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a backend service that ONLY returns valid JSON."
      },
      {
        role: "user",
        content: `
Create a sustainability commuting challenge.

Transport mode: ${params.transportMode}
Emission reduction target: ${params.emissionTarget} kg CO2
Duration: ${params.durationDays} days
Difficulty: ${params.difficulty}
Type: ${params.type}

Return ONLY valid JSON in this exact format:

{
  "title": "string",
  "tagline": "string",
  "description": "string"
}
`
      }
    ],
    temperature: 0.7
  });

  const content = response.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error("AI response was not valid JSON");
  }
};