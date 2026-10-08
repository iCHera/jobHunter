const { notify } = require('../bot/index'); 
const OpenAI = require("openai");
require('dotenv').config();

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function generateCoverLetter(vacancyDescription) {
    try {
        console.log("🚀 Генерирую письмо...");
        
        const completion = await groq.chat.completions.create({
            model: "nvidia/nemotron-3.5-lightning:free", 
            messages: [
                {
                    role: "system",
                    content: "Ты — начинающий Frontend-разработчик, который около года изучает веб-разработку и активно развивается. Напиши короткое, цепляющее сопроводительное письмо (до 500 знаков и на русском языке). Учитывай, что у меня пока нет коммерческого опыта, но есть учебные и личные проекты, желание развиваться и быстро учиться. Мой стек: Vue 3, React, Node.js, JavaScript, TypeScript, Nuxt.js, Next.js, MongoDB. Пиши сразу по делу, без приветствий HR. Не придумывай новый стек и не добавляй опыт, которого у меня нет, а так же в сообщении не указывай портфолио."
                },
                {
                    role: "user",
                    content: `Вакансия: ${vacancyDescription}`
                }
            ],
            temperature: 0.4,
        });

        if (completion.choices && completion.choices[0]) {
            let text = completion.choices[0].message.content;
            text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            return text;
        }
        
        return "Ошибка: пустой ответ.";

    } catch (err) {
        console.error("❌ Ошибка API:");
        console.error(err.message);
        
        if (err.message.includes('404')) {
            notify(`⚠️ Модель Gemini недоступна. Попробуй сменить модель в коде.`);
        } else {
            notify(`❌ Ошибка ИИ: ${err.message}`);
        }
        
        return `Ошибка: ${err.message}`;
    }
}

module.exports = { generateCoverLetter };