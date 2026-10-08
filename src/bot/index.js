const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const MY_ID = Number(process.env.MY_TELEGRAM_ID);

bot.use(async (ctx, next) => {
    if (ctx.from && ctx.from.id !== MY_ID) {
        console.log(`⚠️ Попытка доступа от чужого пользователя: ${ctx.from.id}`);
        return ctx.reply('может пользоваться только владелец бота');
    }
    return next();
});

let isRunning = false;

bot.start((ctx) => {
    ctx.reply('Привет! Я твой Job Hunter. Команды:\n/run - запустить поиск\n/stop - остановить\n/status - проверить работу');
});

bot.command('run', (ctx) => {
    isRunning = true;
    ctx.reply('🚀 Скрипт запущен!');
});

bot.command('stop', (ctx) => {
    isRunning = false;
    ctx.reply('🛑 Скрипт остановлен после завершения текущего цикла.');
});

bot.command('status', (ctx) => {
    ctx.reply(isRunning ? '✅ Скрипт работает' : '💤 Скрипт спит');
});

const notify = (message) => {
    if (MY_ID) {
        bot.telegram.sendMessage(MY_ID, message, { parse_mode: 'HTML' }).catch(err => {
            console.error('Ошибка отправки в ТГ:', err.message);
        });
    }
};

bot.launch();

module.exports = { getStatus: () => isRunning, notify };