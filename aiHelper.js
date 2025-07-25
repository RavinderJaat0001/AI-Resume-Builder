// aiHelper.js
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Keep your key secure

async function enhanceSummary(rawSummary) {
  const prompt = `
  Improve the following professional summary. Make it more concise, grammatically correct, and compelling for a resume:
  "${rawSummary}"
  `;

  try {
    const response = await openai.chat.completions.create({
     model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI Error:", error);
    return rawSummary; // fallback to original
  }
}

module.exports = { enhanceSummary };
