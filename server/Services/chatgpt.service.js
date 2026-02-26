const OpenAI = require("openai");

exports.generateChallengeContent = async (params) => {
  
  if (!process.env.OPENAI_API_KEY || process.env.USE_MOCK === "true") {
    return {
      title: `${params.transportMode} Challenge`,
      tagline: "Go greener today!",
      description: `Reduce ${params.emissionTarget}kg CO2 in ${params.durationDays} days by choosing ${params.transportMode}.`
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
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

    
    return JSON.parse(response.choices[0].message.content);

  } catch (err) {
    console.error("OpenAI API error:", err);
    
    return {
      title: `${params.transportMode} Challenge`,
      tagline: "Go greener today!",
      description: `Reduce ${params.emissionTarget}kg CO2 in ${params.durationDays} days by choosing ${params.transportMode}.`
    };
  }
};