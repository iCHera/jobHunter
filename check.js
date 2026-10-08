const axios = require('axios');

async function showFreeModels() {
    try {
        console.log("🔍 Запрашиваю список бесплатных моделей у OpenRouter...");
        const response = await axios.get('https://openrouter.ai/api/v1/models');
        
        // Фильтруем модели, у которых цена за промпт и выполнение равна 0
        const freeModels = response.data.data.filter(model => 
            parseFloat(model.pricing.prompt) === 0 && 
            parseFloat(model.pricing.completion) === 0
        );

        console.log("\n✅ Актуальные бесплатные модели:");
        freeModels.forEach(m => {
            console.log(`- ${m.id}`);
        });
        
    } catch (error) {
        console.error("❌ Ошибка при получении списка:", error.message);
    }
}

showFreeModels();