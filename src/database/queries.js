const { notify } = require('../bot/index'); 
const pool = require('./db')

async function isVacancyNew(hhId) {
    const [rows] = await pool.execute('SELECT id FROM vacancies WHERE hh_id = ? AND status = "applied"' , [hhId])
    return rows.length === 0
}

async function saveVacancy(data) {
        const sql = `
        INSERT INTO vacancies (hh_id, title, company, url, status) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        title = VALUES(title),
        company = VALUES(company),
        status = VALUES(status)
    `;

    const params = [
        data.hhId || null,
        data.title || null,
        data.company || null,
        data.url || null,
        data.status || 'new'
    ];

    try {
        await pool.execute(sql, params);
    } catch (error) {
        console.error("❌ Ошибка при сохранении вакансии в БД:", error.message);
        notify(`❌ Ошибка при сохранении вакансии в БД:", ${error.message}`)
    }
}

async function updateVacancyStatus (hhID, status, letter) {
    const sql = 'UPDATE vacancies SET status = ?, cover_letter = ? WHERE hh_id = ?'
    await pool.execute(sql, [status, letter, hhID])
}

module.exports = {isVacancyNew, saveVacancy, updateVacancyStatus}