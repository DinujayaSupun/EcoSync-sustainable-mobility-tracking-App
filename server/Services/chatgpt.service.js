const OpenAI = require("openai");

exports.generateChallengeContent = async (params) => {
  // DEV MOCK: skip API if no key or USE_MOCK=true
  if (!process.env.OPENAI_API_KEY || process.env.USE_MOCK === "true") {
    return {
      title: `${params.transportMode} Challenge`,
      tagline: "Go greener today!",
      description: `Reduce ${params.emissionTarget}kg CO2 in ${params.durationDays} days by choosing ${params.transportMode}.`
    };
  }

  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // or gpt-4-turbo if your key supports
      messages: [
        { role: "system", content: "You are a backend service that ONLY returns valid JSON." },
        {
          role: "user",
          content: `
Create a sustainability commuting challenge.
Transport mode: ${params.transportMode}
Emission reduction target: ${params.emissionTarget} kg CO2
Duration: ${params.durationDays} days
Difficulty: ${params.difficulty}
Type: ${params.type} 

Return ONLY valid JSON:
{ "title": "string", "tagline": "string", "description": "string" }
          `
        }
      ],
      temperature: 0.7
    });

    // Parse AI response
    return JSON.parse(response.choices[0].message.content);

  } catch (err) {
    console.error("OpenAI API error:", err);
    // fallback so your server doesn’t crash
    return {
      title: `${params.transportMode} Challenge`,
      tagline: "Go greener today!",
      description: `Reduce ${params.emissionTarget}kg CO2 in ${params.durationDays} days by choosing ${params.transportMode}.`
    };
  }
};