const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Path ke folder logs di luar proyek
const logDir = path.join(__dirname, '../..', 'logs');
const logPath = path.join(logDir, 'app.log');

// Buat folder logs jika belum ada
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Konfigurasi logger
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: logPath }), // Menulis log ke file
        new transports.Console() // Menampilkan log di console
    ]
});

module.exports = logger;
