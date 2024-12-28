const mysql = require('mysql2');

// Veritabanı bağlantısı
const pool = mysql.createPool({
    host: 'localhost',      // Veritabanı sunucu adresi
    user: 'root',           // MySQL kullanıcı adı
    password: '',           // MySQL şifreniz
    database: 'karar_destek', // Veritabanı adı
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Bağlantıyı test etmek için
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Veritabanı bağlantısı başarısız:', err.message);
    } else {
        console.log('Veritabanı bağlantısı başarılı!');
        connection.release();
    }
});

module.exports = pool;
