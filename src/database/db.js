const mysql = require('mysql2/promise');
require('dotenv').config();

const { notify } = require('../bot/index'); 

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        const msg = '✅ Подключение к MySQL успешно установлено';
        console.log(msg);
        notify(msg); 
        connection.release();
    })
    .catch(err => {
        const errMsg = `❌ Ошибка подключения к MySQL: ${err.message}`;
        console.error(errMsg);
        notify(errMsg);
    });

module.exports = pool;