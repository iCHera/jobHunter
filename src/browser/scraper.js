const { notify } = require('../bot/index'); 

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function openBrowser() {
    const browser = await puppeteer.launch({
        headless: false, 
        userDataDir: './user_data', 
        args: ['--start-maximized'], 
        protocolTimeout: 60000
    });

    let pages = await browser.pages();
    let page = pages.length > 0 ? pages[0] : await browser.newPage();

    page.setDefaultTimeout(60000); 
    
    await page.setViewport({ width: 2560, height: 1440 });
    
    return { browser, page };
}

async function getVacancyData(url, page) { 
    try {
        console.log(`Перехожу по ссылке: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        await page.waitForSelector('[data-qa="vacancy-description"]', { timeout: 10000 });

        const data = await page.evaluate(() => {
            const title = document.querySelector('[data-qa="vacancy-title"]')?.innerText;
            const company = document.querySelector('[data-qa="vacancy-company-name"]')?.innerText;
            const description = document.querySelector('[data-qa="vacancy-description"]')?.innerText;
            
            const questionsElements = document.querySelectorAll('[data-qa="vacancy-response-questions-item"]');
            const questions = Array.from(questionsElements).map(el => el.innerText);
            
            return { title, company, description, questions };
        });

        return data;
    } catch (error) {
        console.error("❌ Ошибка при парсинге вакансии:", error.message);
        notify(`❌ Ошибка при парсинге вакансии:, ${error.message}`)
        return null;
    }
}

async function getVacancyLinks(page, searchURL) {
    await page.goto (searchURL, { waitUntil: 'networkidle2'})

    const link = await page.evaluate(() => { 
        const anchors = Array.from(document.querySelectorAll('a[href*="/vacancy/"]'))

        return anchors
            .map(a => a.href.split('?')[0])
            .filter(href => href.includes('/vacancy/'))
    })

    return [...new Set(link)]
}

async function applyToVacancy(page, url, letter) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        const applyBtnSelector = '[data-qa="vacancy-response-link-top"]';
        await page.waitForSelector(applyBtnSelector, { visible: true, timeout: 10000 });

        const buttonText = await page.$eval(applyBtnSelector, el => el.innerText);
        if (buttonText.includes('Вы откликнулись') || buttonText.includes('Сообщение в чате')) {
            console.log("⏭️ Уже есть отклик на эту вакансию.");
            return true; 
        }

        await page.click(applyBtnSelector);

        const textareaSelector = 'textarea[name="text"], textarea[data-qa="vacancy-response-popup-form-letter-input"]';

        try {
            await page.waitForSelector(textareaSelector, { visible: true, timeout: 5000 });

            await page.click(textareaSelector);
            await page.click(textareaSelector, { clickCount: 3 });
            await page.keyboard.press('Backspace');

            await page.type(textareaSelector, letter, { delay: 200 });
            console.log("✅ Письмо вставлено.");

            const submitBtnSelector = '[data-qa="vacancy-response-letter-submit"], [data-qa="vacancy-response-submit-popup"]';
            await page.waitForSelector(submitBtnSelector, { visible: true, timeout: 5000 });
            
            await new Promise(r => setTimeout(r, 2000));
            await page.click(submitBtnSelector); 
            console.log("🚀 Кнопка 'Отправить' нажата.");

            return true;

        } catch (innerError) {
            console.log("ℹ️ Поле для письма не появилось. Проверяю, ушел ли отклик сразу...");
                const isSuccess = await page.evaluate(() => {
                const text = document.body.innerText;
                return text.includes('Резюме доставлено') || text.includes('Ваш отклик отправлен');
            });

            if (isSuccess) {
                console.log("✅ Отклик подтвержден сайтом (письмо не потребовалось).");
                return true;
            } else {
                throw new Error("Не найдено ни поля для письма, ни подтверждения отклика.");
            }
        }

    } catch (e) {
        console.log(`⚠️ Ошибка при отклике: ${e.message}`);
        notify(`⚠️ Ошибка при отклике: ${e.message}`)
        return false;
    }
}

module.exports = {openBrowser ,getVacancyData, getVacancyLinks, applyToVacancy };