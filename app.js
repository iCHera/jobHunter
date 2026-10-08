const { openBrowser, getVacancyLinks, getVacancyData, applyToVacancy } = require('./src/browser/scraper');
const { generateCoverLetter } = require('./src/services/geminiService');
const { isVacancyNew, saveVacancy, updateVacancyStatus } = require('./src/database/queries');
const { getStatus, notify } = require('./src/bot/index'); 

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function startAutomation() {
    console.log("🤖 Скрипт запущен и ожидает команду /run в Telegram...");

    const { browser, page } = await openBrowser();
    const searchUrl = 'https://rabota.by/search/vacancy?text=Frontend&area=1002&order_by=publication_time';
    // const searchUrl = 'https://rabota.by/search/vacancy?text=Fullstack&area=1002&order_by=publication_time';

    while (true) {
        if (getStatus()) {
            console.log("🚀 Статус: РАБОТА. Начинаю поиск вакансий...");
            
            try {
                console.log("🔎 Собираю ссылки...");
                const links = await getVacancyLinks(page, searchUrl);
                console.log(`Найдено вакансий: ${links.length}`);

                for (const url of links) {
                    if (!getStatus()) {
                        console.log("🛑 Получена команда STOP. Прерываю обход ссылок.");
                        break;
                    }

                    const hhId = url.match(/\/vacancy\/(\d+)/)?.[1];
                    if (!hhId) continue;

                    if (await isVacancyNew(hhId)) {
                        console.log(`\n--- Новая вакансия [${hhId}] ---`);
                        
                        const vacancy = await getVacancyData(url, page); 
                        
                        if (vacancy) {
                            const readTime = Math.round(Math.random() * (45000 - 15000) + 15000)
                            console.log(`📖 Читаю вакансию... (${Math.round(readTime/1000)} сек)`);
                            await sleep(readTime);

                            const letter = await generateCoverLetter(vacancy.description);

                            await saveVacancy({ hhId, title: vacancy.title, company: vacancy.company, url });

                            const success = await applyToVacancy(page, url, letter);
                            
                            if (success) {
                                await updateVacancyStatus(hhId, 'applied', letter);

                                notify(
                                    `🚀 <b>Отклик отправлен!</b>\n\n` +
                                    `🏢 <b>Компания:</b> ${vacancy.company}\n\n` +
                                    `📝 <b>Вакансия:</b> ${vacancy.title}\n\n` +
                                    `✉️ <b>Сопроводительное письмо:</b>\n` +
                                    `<i>${letter}</i>\n\n` + 
                                    `🔗 <a href="${url}">Открыть на сайте</a>`
                                );
                                
                                console.log(`✅ Отклик на ${hhId} успешно завершен.`);

                                const waitMinutes = Math.floor(Math.random() * (8 - 3) + 3);
                                console.log(`⏱️ Жду ${waitMinutes} мин перед следующей отправкой...`);
                                notify(
                                    `⌚ <b>Жду ${waitMinutes} перед следующим просмотртом резюме</b>`
                                )
                                await sleep(waitMinutes * 60 * 1000);
                            }                
                        }
                    } else {
                        console.log(`⏭️ Пропускаем [${hhId}], уже видели.`);
                    }
                }
                
                console.log("😴 Все текущие ссылки обработаны. Жду 15 минут перед новым поиском...");
                notify(`✅ <b>Круг завершен!</b>\nВсе найденные вакансии обработаны. Следующая проверка через 15 минут.`);
                await sleep(15 * 60 * 1000); 

            } catch (error) {
                console.error("❌ Ошибка в цикле автоматизации:", error.message);
                notify(`⚠️ <b>Произошла ошибка:</b>\n<code>${error.message}</code>`);
                await sleep(60000); 
            }

        } else {
            await sleep(5000);
        }
    }
}

startAutomation().catch(err => {
    console.error("🚨 КРИТИЧЕСКАЯ ОШИБКА:", err);
    notify(`🚨 <b>Скрипт упал!</b>\n<code>${err.message}</code>`);
});