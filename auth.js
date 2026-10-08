const { openBrowser } = require('./src/browser/scraper');
const readline = require('readline');

const waitForKey = () => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question('\n👉 Если вы уже вошли, но бот не переключается — нажмите ENTER здесь...', () => {
        rl.close();
        resolve();
    }));
};

async function runFullAuth() {
    console.log("🚀 Запуск полной авторизации (Rabota.by + HH.ru)");
    const { browser, page } = await openBrowser();
    
    page.setDefaultNavigationTimeout(0);

    try {
        console.log("\n1. Открываю Rabota.by...");
        await page.goto('https://rabota.by/login', { waitUntil: 'networkidle2' });
        console.log("👉 ВОЙДИТЕ В АККАУНТ.");

        await Promise.race([
            page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 0 }),
            waitForKey() 
        ]);
        
        console.log("✅ Вход на Rabota.by зафиксирован!");
        await new Promise(r => setTimeout(r, 2000));

        console.log("\n2. Перехожу на HH.ru...");
        await page.goto('https://hh.ru/login', { waitUntil: 'networkidle2' });
        console.log("👉 ВОЙДИТЕ В АККАУНТ на HH.ru.");

        await Promise.race([
            page.waitForFunction(() => !window.location.href.includes('login'), { timeout: 0 }),
            waitForKey()
        ]);

        console.log("✅ Вход на HH.ru зафиксирован!");
        console.log("\n🎉 Все сессии сохранены! Теперь можно закрыть браузер и запускать app.js.");

    } catch (e) {
        console.error("❌ Ошибка:", e.message);
    }
}

runFullAuth();