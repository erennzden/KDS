const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db'); // Veritabanı bağlantısı

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const cors = require('cors');
app.use(cors()); // CORS middleware'i ekleyin
app.use(express.json());
app.use(express.static('public'));



// Giriş doğrulama
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM kullanici WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err.message);
            res.status(500).send('Sunucu hatası');
        } else if (results.length > 0) {
            res.redirect('/dashboard.html'); // Giriş başarılıysa yönlendirme
        } else {
            res.send('<script>alert("Geçersiz kullanıcı adı veya şifre!"); window.history.back();</script>');
        }
    });
});

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Güzergahlar rotası
app.get('/guzergahlar/:guzergah', (req, res) => {
    const filePath = path.join(__dirname, `public/views/guzergahlar/${req.params.guzergah}.html`);
    res.sendFile(filePath);
});

// Ürünler rotası
app.get('/urunler/:urun', (req, res) => {
    const filePath = path.join(__dirname, `public/views/urunler/${req.params.urun}.html`);
    res.sendFile(filePath);
});

// Tahminleme rotası
app.get('/tahminleme/tahmin_yap', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/tahminleme/tahmin_yap.html'));
});


// Ürünlerin 2023 ve 2024 toplam satışlarını getiren API
app.get('/api/urun-satis', (req, res) => {
    const sqlQuery = `
        SELECT 
            u.urun_adi AS Urun,
            SUM(CASE WHEN YEAR(d.tarih) = 2023 THEN d.satilan_miktar ELSE 0 END) AS Satis_2023,
            SUM(CASE WHEN YEAR(d.tarih) = 2024 THEN d.satilan_miktar ELSE 0 END) AS Satis_2024
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun u ON d.urun_id = u.urun_id
        GROUP BY 
            u.urun_adi;
    `;

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// Ürünlerin 2023 ve 2024 toplam iade sayılarını getiren API
app.get('/api/urun-iadeler', (req, res) => {
    const sqlQuery = `
        SELECT 
            u.urun_adi AS Urun,
            SUM(CASE WHEN YEAR(d.tarih) = 2023 THEN d.iade_miktar ELSE 0 END) AS Iade_2023,
            SUM(CASE WHEN YEAR(d.tarih) = 2024 THEN d.iade_miktar ELSE 0 END) AS Iade_2024
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun u ON d.urun_id = u.urun_id
        GROUP BY 
            u.urun_adi;
    `;

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});

// Ürünlerin 2024 yılı iade oranlarını getiren API
app.get('/api/urun-iadeler-2024', (req, res) => {
    const sqlQuery = `
        SELECT 
            u.urun_adi AS Urun,
            SUM(d.iade_miktar) AS Toplam_Iade_2024
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun u ON d.urun_id = u.urun_id
        WHERE 
            YEAR(d.tarih) = 2024
        GROUP BY 
            u.urun_adi;
    `;

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// Tam Buğday ürününün yıllık iade sayılarını getiren API
app.get('/api/tam-bugday-iade-sayilari', (req, res) => {
    const sqlQuery = `
        SELECT 
            YEAR(tarih) AS Yil,
            SUM(iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari
        WHERE 
            urun_id = 1 -- 'Tam Buğday (400gr)' ürününün ID'si
        GROUP BY 
            YEAR(tarih);
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// Tam Buğday ekmeği için en fazla iade yapan 5 bayiyi getiren API
app.get('/api/tam-bugday-en-fazla-iade-bayi', (req, res) => {
    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            d.urun_id = 1 -- 'Tam Buğday (400gr)' ürününün ID'si
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});

//------------------------------------------------------------------------------------------------//

// Kepek Ekmek ürününün yıllık iade sayılarını getiren API
app.get('/api/kepek-ekmek-iade-sayilari', (req, res) => {
    const sqlQuery = `
        SELECT 
            YEAR(tarih) AS Yil,
            SUM(iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari
        WHERE 
            urun_id = 2 -- 'Kepek Ekmegi (200gr)' ürününün ID'si
        GROUP BY 
            YEAR(tarih);
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// Kepek ekmeği için en fazla iade yapan 5 bayiyi getiren API
app.get('/api/kepek-ekmek-en-fazla-iade-bayi', (req, res) => {
    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            d.urun_id = 2 -- 'Kepek Ekmegi (200gr)' ürününün ID'si
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


//------------------------------------------------------------------------------------------------//

// Cavdar Ekmegi ürününün yıllık iade sayılarını getiren API
app.get('/api/cavdar-ekmegi-iade-sayilari', (req, res) => {
    const sqlQuery = `
        SELECT 
            YEAR(tarih) AS Yil,
            SUM(iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari
        WHERE 
            urun_id = 3 -- 'Cavdar Ekmegi (400gr)' ürününün ID'si
        GROUP BY 
            YEAR(tarih);
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// Cavdar ekmeği için en fazla iade yapan 5 bayiyi getiren API
app.get('/api/cavdar-ekmegi-en-fazla-iade-bayi', (req, res) => {
    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            d.urun_id = 3 -- 'Cavdar Ekmegi (200gr)' ürününün ID'si
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});



//------------------------------------------------------------------------------------------------//

// Karadeniz Ekmegi ürününün yıllık iade sayılarını getiren API
app.get('/api/karadeniz-ekmegi-iade-sayilari', (req, res) => {
    const sqlQuery = `
        SELECT 
            YEAR(tarih) AS Yil,
            SUM(iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari
        WHERE 
            urun_id = 4 -- 'Karadeniz Ekmegi (400gr)' ürününün ID'si
        GROUP BY 
            YEAR(tarih);
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// Karadeniz ekmeği için en fazla iade yapan 5 bayiyi getiren API
app.get('/api/karadeniz-ekmegi-en-fazla-iade-bayi', (req, res) => {
    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            d.urun_id = 4 -- 'Karadeniz Ekmegi (400gr)' ürününün ID'si
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});




//------------------------------------------------------------------------------------------------//

// Karakilcik Ekmegi ürününün yıllık iade sayılarını getiren API
app.get('/api/karakilcik-ekmegi-iade-sayilari', (req, res) => {
    const sqlQuery = `
        SELECT 
            YEAR(tarih) AS Yil,
            SUM(iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari
        WHERE 
            urun_id = 5 -- 'Karakilcik Ekmegi (500gr)' ürününün ID'si
        GROUP BY 
            YEAR(tarih);
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// Karakilcik ekmeği için en fazla iade yapan 5 bayiyi getiren API
app.get('/api/karakilcik-ekmegi-en-fazla-iade-bayi', (req, res) => {
    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            d.urun_id = 5 -- 'Karakilcik Ekmegi (500gr)' ürününün ID'si
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});




//------------------------------------------------------------------------------------------------//

// Eksi Maya Ekmegi ürününün yıllık iade sayılarını getiren API
app.get('/api/eksi-maya-ekmegi-iade-sayilari', (req, res) => {
    const sqlQuery = `
        SELECT 
            YEAR(tarih) AS Yil,
            SUM(iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari
        WHERE 
            urun_id = 6 -- 'eksi-maya Ekmegi (500gr)' ürününün ID'si
        GROUP BY 
            YEAR(tarih);
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// eksi-maya ekmeği için en fazla iade yapan 5 bayiyi getiren API
app.get('/api/eksi-maya-ekmegi-en-fazla-iade-bayi', (req, res) => {
    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            d.urun_id = 6 -- 'eksi-maya Ekmegi (500gr)' ürününün ID'si
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});






//------------------------------------------------------------------------------------------------//

// Ekmek ürününün yıllık iade sayılarını getiren API
app.get('/api/ekmek-iade-sayilari', (req, res) => {
    const sqlQuery = `
        SELECT 
            YEAR(tarih) AS Yil,
            SUM(iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari
        WHERE 
            urun_id = 7 -- 'Ekmek (200gr)' ürününün ID'si
        GROUP BY 
            YEAR(tarih);
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


// Ekmek için en fazla iade yapan 5 bayiyi getiren API
app.get('/api/ekmek-en-fazla-iade-bayi', (req, res) => {
    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            d.urun_id = 7 -- 'Ekmek (200gr)' ürününün ID'si
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


//------------------------------------------------------------------------------------------------//

//karşıyaka Bazında En Fazla İade Yapan Bayiler API

app.get('/api/karsiyaka_guzergah-en-fazla-iade-bayi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 1
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});

// Karşıyaka Bazında Ürünlerin İade Dağılımı API

app.get('/api/karsiyaka_guzergah-urun-iade-dagilimi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            u.urun_adi AS Urun,
            SUM(d.iade_miktar) AS Iade_Miktari
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun u ON d.urun_id = u.urun_id
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 1
        GROUP BY 
            u.urun_adi
        ORDER BY 
            Iade_Miktari DESC;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


//------------------------------------------------------------------------------------------------//

//Bozyaka Bazında En Fazla İade Yapan Bayiler API

app.get('/api/bozyaka_guzergah-en-fazla-iade-bayi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 2
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});

// bozyaka Bazında Ürünlerin İade Dağılımı API

app.get('/api/bozyaka_guzergah-urun-iade-dagilimi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            u.urun_adi AS Urun,
            SUM(d.iade_miktar) AS Iade_Miktari
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun u ON d.urun_id = u.urun_id
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 2
        GROUP BY 
            u.urun_adi
        ORDER BY 
            Iade_Miktari DESC;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


//------------------------------------------------------------------------------------------------//

//konak Bazında En Fazla İade Yapan Bayiler API

app.get('/api/konak_guzergah-en-fazla-iade-bayi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 3
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});

// konak Bazında Ürünlerin İade Dağılımı API

app.get('/api/konak_guzergah-urun-iade-dagilimi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            u.urun_adi AS Urun,
            SUM(d.iade_miktar) AS Iade_Miktari
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun u ON d.urun_id = u.urun_id
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 3
        GROUP BY 
            u.urun_adi
        ORDER BY 
            Iade_Miktari DESC;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});



//------------------------------------------------------------------------------------------------//

//gaziemir Bazında En Fazla İade Yapan Bayiler API

app.get('/api/gaziemir_guzergah-en-fazla-iade-bayi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 4
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});

// gaziemir Bazında Ürünlerin İade Dağılımı API

app.get('/api/gaziemir_guzergah-urun-iade-dagilimi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            u.urun_adi AS Urun,
            SUM(d.iade_miktar) AS Iade_Miktari
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun u ON d.urun_id = u.urun_id
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 4
        GROUP BY 
            u.urun_adi
        ORDER BY 
            Iade_Miktari DESC;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});


//------------------------------------------------------------------------------------------------//

//buca Bazında En Fazla İade Yapan Bayiler API

app.get('/api/buca_guzergah-en-fazla-iade-bayi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            b.bayi_adi AS Bayi,
            SUM(d.iade_miktar) AS Iade_Sayisi
        FROM 
            dagitim_kayitlari d
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 5
        GROUP BY 
            b.bayi_adi
        ORDER BY 
            Iade_Sayisi DESC
        LIMIT 5;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});

// gaziemir Bazında Ürünlerin İade Dağılımı API

app.get('/api/buca_guzergah-urun-iade-dagilimi/:guzergahId', (req, res) => {
    const guzergahId = req.params.guzergahId;

    const sqlQuery = `
        SELECT 
            u.urun_adi AS Urun,
            SUM(d.iade_miktar) AS Iade_Miktari
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun u ON d.urun_id = u.urun_id
        JOIN 
            bayi b ON d.bayi_id = b.bayi_id
        WHERE 
            b.guzergah_id = 5
        GROUP BY 
            u.urun_adi
        ORDER BY 
            Iade_Miktari DESC;
    `;

    db.query(sqlQuery, [guzergahId], (err, results) => {
        if (err) {
            console.error('SQL sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});

//------------------------------------------------------------------------------------------------//

app.get('/api/tahminleme', (req, res) => {
    const salesRate = parseFloat(req.query.salesRate) / 100;
    const returnsRate = parseFloat(req.query.returnsRate) / 100;

    const salesQuery = `
        SELECT 
            urun.urun_adi AS Urun,
            (SUM(CASE WHEN YEAR(d.tarih) = 2023 THEN d.satilan_miktar ELSE 0 END) +
             SUM(CASE WHEN YEAR(d.tarih) = 2024 AND MONTH(d.tarih) <= 6 THEN d.satilan_miktar ELSE 0 END) * 2) * (1 + ?) AS Tahmini_Satis
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun ON d.urun_id = urun.urun_id
        GROUP BY 
            urun.urun_adi;
    `;

    const returnsQuery = `
        SELECT 
            urun.urun_adi AS Urun,
            (SUM(CASE WHEN YEAR(d.tarih) = 2023 THEN d.iade_miktar ELSE 0 END) +
             SUM(CASE WHEN YEAR(d.tarih) = 2024 AND MONTH(d.tarih) <= 6 THEN d.iade_miktar ELSE 0 END) * 2) * (1 + ?) AS Tahmini_Iade
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun ON d.urun_id = urun.urun_id
        GROUP BY 
            urun.urun_adi;
    `;

    db.query(salesQuery, [salesRate], (err, salesResults) => {
        if (err) {
            console.error('Satış sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        db.query(returnsQuery, [returnsRate], (err, returnsResults) => {
            if (err) {
                console.error('İade sorgu hatası:', err);
                res.status(500).json({ error: 'Veritabanı hatası' });
                return;
            }
            res.json({ sales: salesResults, returns: returnsResults });
        });
    });
});


//------------------------------------------------------------------------------------------------//

app.get('/api/mevsimsel-tahminleme', (req, res) => {
    const season = req.query.season; // 'yaz' veya 'kış' bilgisi gelecek
    const rate = parseFloat(req.query.rate) / 100;

    let months;
    if (season === 'yaz') {
        months = [6, 7, 8]; // Yaz ayları
    } else if (season === 'kış') {
        months = [12, 1, 2]; // Kış ayları
    } else {
        res.status(400).json({ error: 'Geçersiz mevsim bilgisi' });
        return;
    }

    const salesQuery = `
        SELECT 
            urun.urun_adi AS Urun,
            SUM(CASE WHEN MONTH(d.tarih) IN (${months.join(',')}) THEN d.satilan_miktar ELSE 0 END) * (1 + ?) AS Tahmini_Satis,
            SUM(CASE WHEN MONTH(d.tarih) IN (${months.join(',')}) THEN d.iade_miktar ELSE 0 END) * (1 + ?) AS Tahmini_Iade
        FROM 
            dagitim_kayitlari d
        JOIN 
            urun ON d.urun_id = urun.urun_id
        GROUP BY 
            urun.urun_adi;
    `;

    db.query(salesQuery, [rate, rate], (err, results) => {
        if (err) {
            console.error('Mevsimsel tahminleme sorgu hatası:', err);
            res.status(500).json({ error: 'Veritabanı hatası' });
            return;
        }
        res.json(results);
    });
});






// Sunucu başlat
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
