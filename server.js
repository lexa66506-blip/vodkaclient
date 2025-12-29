const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL подключение (Render даёт DATABASE_URL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Сессии с хранением в PostgreSQL (не теряются при перезагрузке)
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    secret: 'vodka-client-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true
    }
}));

// Инициализация таблиц
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                uid SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) DEFAULT NULL,
                hwid VARCHAR(255) DEFAULT NULL,
                role VARCHAR(50) DEFAULT 'user',
                subscription_type VARCHAR(50) DEFAULT NULL,
                subscription_expires TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Добавляем колонку email если её нет
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL`).catch(() => {});
        // Добавляем колонку role если её нет
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'`).catch(() => {});
        // Устанавливаем дефолтную роль для существующих пользователей без роли
        await pool.query(`UPDATE users SET role = 'user' WHERE role IS NULL`).catch(() => {});
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS keys (
                id SERIAL PRIMARY KEY,
                key_code VARCHAR(255) UNIQUE NOT NULL,
                subscription_type VARCHAR(50) NOT NULL,
                duration_days INTEGER NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                used_by INTEGER DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_at TIMESTAMP DEFAULT NULL
            )
        `);
        
        // Таблица для отслеживания бесплатных ключей (защита от абуза)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS free_keys_used (
                id SERIAL PRIMARY KEY,
                ip_address VARCHAR(255),
                hwid VARCHAR(255),
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Таблица для media конфигов
        await pool.query(`
            CREATE TABLE IF NOT EXISTS media_configs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                filename VARCHAR(255) NOT NULL,
                author_id INTEGER REFERENCES users(uid),
                author_name VARCHAR(255),
                price INTEGER DEFAULT 0,
                funpay_url VARCHAR(500),
                promo_code VARCHAR(50),
                downloads INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Таблица для media пользователей
        await pool.query(`
            CREATE TABLE IF NOT EXISTS media_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Таблицы PostgreSQL созданы');
    } catch (err) {
        console.error('❌ Ошибка создания таблиц:', err);
    }
}

initDB();

// API: Регистрация
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) return res.status(400).json({ success: false, message: 'Заполните все поля' });
    if (username.length < 3) return res.status(400).json({ success: false, message: 'Логин минимум 3 символа' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Пароль минимум 6 символов' });
    if (!email.includes('@')) return res.status(400).json({ success: false, message: 'Некорректный email' });
    
    // Проверка на английские буквы, цифры и спецсимволы (без русских)
    const validChars = /^[a-zA-Z0-9_\-\.]+$/;
    const validPassword = /^[a-zA-Z0-9!@#$%^&*()_\-+=\[\]{}|;:'"<>,.?/\\~`]+$/;
    
    if (!validChars.test(username)) {
        return res.status(400).json({ success: false, message: 'Логин только английские буквы, цифры и _-.' });
    }
    if (!validPassword.test(password)) {
        return res.status(400).json({ success: false, message: 'Пароль только английские буквы, цифры и спецсимволы' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING uid',
            [username, hashedPassword, email]
        );
        
        req.session.userId = result.rows[0].uid;
        req.session.username = username;
        res.json({ success: true, message: 'Регистрация успешна!', uid: result.rows[0].uid, username });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ success: false, message: 'Пользователь уже существует' });
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Вход
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Заполните все поля' });

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Неверный логин или пароль' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ success: false, message: 'Неверный логин или пароль' });

        req.session.userId = user.uid;
        req.session.username = user.username;
        res.json({ success: true, message: 'Вход выполнен!', uid: user.uid, username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Проверка авторизации
app.get('/api/check-auth', async (req, res) => {
    if (!req.session.userId) return res.json({ authenticated: false });

    try {
        const result = await pool.query(
            'SELECT uid, username, email, hwid, role, created_at, subscription_type, subscription_expires FROM users WHERE uid = $1',
            [req.session.userId]
        );
        
        if (result.rows.length === 0) return res.json({ authenticated: false });
        const user = result.rows[0];

        let isActive = false;
        if (user.subscription_type) {
            if (user.subscription_type === 'lifetime') isActive = true;
            else if (user.subscription_expires) isActive = new Date(user.subscription_expires) > new Date();
        }

        res.json({
            authenticated: true,
            uid: user.uid,
            username: user.username,
            email: user.email,
            hwid: user.hwid,
            role: user.role || 'user',
            created_at: user.created_at,
            subscription_type: user.subscription_type,
            subscription_expires: user.subscription_expires,
            subscription_active: isActive
        });
    } catch (err) {
        console.error(err);
        res.json({ authenticated: false });
    }
});

// API: Выход
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Выход выполнен' });
});

// API: Смена пароля
app.post('/api/change-password', async (req, res) => {
    const { old_password, new_password } = req.body;
    const userId = req.session.userId;
    
    if (!userId) return res.status(401).json({ success: false, message: 'Не авторизован' });
    if (!old_password || !new_password) return res.status(400).json({ success: false, message: 'Заполните все поля' });
    if (new_password.length < 6) return res.status(400).json({ success: false, message: 'Новый пароль минимум 6 символов' });

    try {
        const result = await pool.query('SELECT password FROM users WHERE uid = $1', [userId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Пользователь не найден' });

        const validPassword = await bcrypt.compare(old_password, result.rows[0].password);
        if (!validPassword) return res.status(400).json({ success: false, message: 'Неверный текущий пароль' });

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password = $1 WHERE uid = $2', [hashedPassword, userId]);

        res.json({ success: true, message: 'Пароль успешно изменен!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Админ - все пользователи
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT uid, username, hwid, role, created_at, subscription_type, subscription_expires FROM users ORDER BY uid'
        );
        res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Выдать роль media
app.post('/api/admin/set-role', async (req, res) => {
    const { uid, role, username } = req.body;
    try {
        if (role === 'media') {
            await pool.query('INSERT INTO media_users (username) VALUES ($1) ON CONFLICT (username) DO NOTHING', [username]);
        } else {
            await pool.query('DELETE FROM media_users WHERE username = $1', [username]);
        }
        res.json({ success: true, message: 'Роль обновлена' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Проверить media роль
app.get('/api/check-media/:username', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM media_users WHERE username = $1', [req.params.username]);
        res.json({ isMedia: result.rows.length > 0 });
    } catch (err) {
        res.json({ isMedia: false });
    }
});

// API: Список всех media юзеров
app.get('/api/admin/media-users', async (req, res) => {
    try {
        const result = await pool.query('SELECT username FROM media_users');
        res.json({ success: true, users: result.rows.map(r => r.username) });
    } catch (err) {
        res.json({ success: false, users: [] });
    }
});

// API: Удаление пользователя
app.post('/api/admin/delete-user', async (req, res) => {
    const { uid } = req.body;
    try {
        await pool.query('DELETE FROM users WHERE uid = $1', [uid]);
        res.json({ success: true, message: 'Пользователь удален' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Генерация ключа
app.post('/api/admin/generate-key', async (req, res) => {
    const { subscription_type, duration_days } = req.body;
    const keyCode = 'VDK-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
        await pool.query(
            'INSERT INTO keys (key_code, subscription_type, duration_days) VALUES ($1, $2, $3)',
            [keyCode, subscription_type, duration_days]
        );
        res.json({ success: true, key: keyCode });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Все ключи
app.get('/api/admin/keys', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM keys ORDER BY id DESC');
        res.json({ success: true, keys: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Активация ключа
app.post('/api/activate-key', async (req, res) => {
    const { key_code } = req.body;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Не авторизован' });
    if (!key_code) return res.status(400).json({ success: false, message: 'Введите ключ' });

    try {
        const keyResult = await pool.query('SELECT * FROM keys WHERE key_code = $1', [key_code]);
        if (keyResult.rows.length === 0) return res.status(400).json({ success: false, message: 'Ключ не найден' });
        
        const key = keyResult.rows[0];
        if (key.used) return res.status(400).json({ success: false, message: 'Ключ уже использован' });

        // Если это ключ сброса HWID
        if (key.subscription_type === 'hwid_reset') {
            await pool.query('UPDATE users SET hwid = NULL WHERE uid = $1', [userId]);
            await pool.query(
                'UPDATE keys SET used = TRUE, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE key_code = $2',
                [userId, key_code]
            );
            return res.json({ success: true, message: 'HWID успешно сброшен! Теперь можете войти с другого ПК.' });
        }

        let expiresDate;
        if (key.subscription_type === 'lifetime') {
            const now = new Date();
            now.setFullYear(now.getFullYear() + 1337);
            expiresDate = now.toISOString();
        } else {
            // Проверяем текущую подписку и продлеваем если активна
            const userResult = await pool.query('SELECT subscription_expires FROM users WHERE uid = $1', [userId]);
            const user = userResult.rows[0];
            let startDate = new Date();
            
            if (user.subscription_expires && new Date(user.subscription_expires) > new Date()) {
                startDate = new Date(user.subscription_expires);
            }
            
            startDate.setDate(startDate.getDate() + key.duration_days);
            expiresDate = startDate.toISOString();
        }

        await pool.query(
            'UPDATE users SET subscription_type = $1, subscription_expires = $2 WHERE uid = $3',
            [key.subscription_type, expiresDate, userId]
        );
        
        await pool.query(
            'UPDATE keys SET used = TRUE, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE key_code = $2',
            [userId, key_code]
        );

        res.json({ success: true, message: 'Подписка активирована!', subscription_type: key.subscription_type, expires: expiresDate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка активации' });
    }
});


// ========================================
// API ДЛЯ ЛОАДЕРА
// ========================================

app.post('/api/launcher/check-subscription', async (req, res) => {
    const { username, password, hwid } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Введите логин и пароль', has_subscription: false });
    }
    if (!hwid) {
        return res.status(400).json({ success: false, message: 'HWID не передан', has_subscription: false });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль', has_subscription: false });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль', has_subscription: false });
        }

        // Проверка: этот HWID уже использовался для бесплатного ключа на другом аккаунте?
        const freeKeyCheck = await pool.query(
            'SELECT * FROM free_keys_used WHERE hwid = $1 AND user_id != $2',
            [hwid, user.uid]
        );
        if (freeKeyCheck.rows.length > 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'Вы уже получали бесплатный ключ на другом аккаунте', 
                has_subscription: false,
                banned: true
            });
        }

        // HWID логика
        if (!user.hwid) {
            await pool.query('UPDATE users SET hwid = $1 WHERE uid = $2', [hwid, user.uid]);
            console.log(`✅ HWID записан для ${username}: ${hwid}`);
            
            // Обновляем HWID в таблице бесплатных ключей если есть
            await pool.query('UPDATE free_keys_used SET hwid = $1 WHERE user_id = $2', [hwid, user.uid]);
        } else if (user.hwid !== hwid) {
            return res.status(403).json({ success: false, message: 'Аккаунт привязан к другому ПК', has_subscription: false });
        }

        // Проверка подписки
        let hasSubscription = false;
        let subscriptionInfo = { type: user.subscription_type, expires: user.subscription_expires, active: false };

        if (user.subscription_type) {
            if (user.subscription_type === 'lifetime') {
                hasSubscription = true;
                subscriptionInfo.active = true;
            } else if (user.subscription_expires) {
                hasSubscription = new Date(user.subscription_expires) > new Date();
                subscriptionInfo.active = hasSubscription;
            }
        }

        res.json({
            success: true,
            message: hasSubscription ? 'Подписка активна' : 'Подписка отсутствует или истекла',
            has_subscription: hasSubscription,
            hwid: user.hwid || hwid,
            user: { uid: user.uid, username: user.username, created_at: user.created_at },
            subscription: subscriptionInfo
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера', has_subscription: false });
    }
});

app.get('/api/launcher/check-uid/:uid', async (req, res) => {
    const { uid } = req.params;
    
    try {
        const result = await pool.query(
            'SELECT uid, username, subscription_type, subscription_expires FROM users WHERE uid = $1',
            [uid]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден', has_subscription: false });
        }

        const user = result.rows[0];
        let hasSubscription = false;
        
        if (user.subscription_type) {
            if (user.subscription_type === 'lifetime') hasSubscription = true;
            else if (user.subscription_expires) hasSubscription = new Date(user.subscription_expires) > new Date();
        }

        res.json({
            success: true,
            has_subscription: hasSubscription,
            user: { uid: user.uid, username: user.username },
            subscription: { type: user.subscription_type, expires: user.subscription_expires, active: hasSubscription }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера', has_subscription: false });
    }
});

// API: Сброс HWID пользователя (админ)
app.post('/api/admin/reset-hwid', async (req, res) => {
    const { uid } = req.body;
    try {
        await pool.query('UPDATE users SET hwid = NULL WHERE uid = $1', [uid]);
        res.json({ success: true, message: 'HWID сброшен' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Получить бесплатный 1 день (с защитой от абуза)
app.post('/api/get-free-day', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Не авторизован' });
    
    // Получаем IP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    
    try {
        // Проверяем, получал ли этот IP уже бесплатный ключ
        const ipCheck = await pool.query('SELECT * FROM free_keys_used WHERE ip_address = $1', [ip]);
        if (ipCheck.rows.length > 0) {
            return res.status(403).json({ success: false, message: 'Вы уже получали бесплатный ключ с этого IP!' });
        }
        
        // Проверяем, получал ли этот пользователь уже бесплатный ключ
        const userCheck = await pool.query('SELECT * FROM free_keys_used WHERE user_id = $1', [userId]);
        if (userCheck.rows.length > 0) {
            return res.status(403).json({ success: false, message: 'Вы уже получали бесплатный ключ!' });
        }
        
        // Проверяем HWID пользователя
        const userResult = await pool.query('SELECT hwid FROM users WHERE uid = $1', [userId]);
        const userHwid = userResult.rows[0]?.hwid;
        
        if (userHwid) {
            const hwidCheck = await pool.query('SELECT * FROM free_keys_used WHERE hwid = $1', [userHwid]);
            if (hwidCheck.rows.length > 0) {
                return res.status(403).json({ success: false, message: 'Бесплатный ключ уже был получен на этом ПК!' });
            }
        }
        
        // Выдаём подписку на 1 день
        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + 1);
        
        await pool.query(
            'UPDATE users SET subscription_type = $1, subscription_expires = $2 WHERE uid = $3',
            ['1day', expiresDate.toISOString(), userId]
        );
        
        // Записываем в таблицу использованных бесплатных ключей
        await pool.query(
            'INSERT INTO free_keys_used (ip_address, hwid, user_id) VALUES ($1, $2, $3)',
            [ip, userHwid || null, userId]
        );
        
        res.json({ success: true, message: 'Бесплатный день активирован! Подписка до ' + expiresDate.toLocaleString('ru-RU') });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API: Сброс базы данных (ОПАСНО!)
app.post('/api/admin/reset-database', async (req, res) => {
    const { confirm_password } = req.body;
    const ADMIN_PASSWORD = 'irairairA1';
    
    if (confirm_password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: 'Неверный пароль подтверждения' });
    }
    
    try {
        // Удаляем все данные
        await pool.query('DELETE FROM keys');
        await pool.query('DELETE FROM users');
        
        // Сбрасываем счётчик UID на 1
        await pool.query('ALTER SEQUENCE users_uid_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE keys_id_seq RESTART WITH 1');
        
        console.log('⚠️ БАЗА ДАННЫХ ПОЛНОСТЬЮ ОЧИЩЕНА!');
        res.json({ success: true, message: 'База данных очищена' });
    } catch (err) {
        console.error('Ошибка сброса БД:', err);
        res.status(500).json({ success: false, message: 'Ошибка сброса базы данных' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

// ========================================
// API ДЛЯ КОНФИГОВ (MARKETPLACE)
// ========================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const configsDir = path.join(__dirname, 'configs');
if (!fs.existsSync(configsDir)) fs.mkdirSync(configsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, configsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname))
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.json', '.cfg', '.txt', '.yaml', '.yml'].includes(ext)) cb(null, true);
        else cb(new Error('Неподдерживаемый формат'));
    }
});

(async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS configs (
            id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT,
            filename VARCHAR(255) NOT NULL, content TEXT,
            author_id INTEGER REFERENCES users(uid),
            author_name VARCHAR(255), private BOOLEAN DEFAULT FALSE,
            downloads INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        // Добавляем колонку content если её нет
        await pool.query(`ALTER TABLE configs ADD COLUMN IF NOT EXISTS content TEXT`).catch(() => {});
    } catch (err) { console.error('Configs table error:', err); }
})();

app.post('/api/configs/upload', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ success: false, message: 'Не авторизован' });
    const { name, description, content, private: isPrivate } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Введите название' });
    if (!content) return res.status(400).json({ success: false, message: 'Конфиг пустой' });
    try {
        const userResult = await pool.query('SELECT username FROM users WHERE uid = $1', [req.session.userId]);
        await pool.query('INSERT INTO configs (name, description, filename, content, author_id, author_name, private) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [name, description || '', name + '.json', content, req.session.userId, userResult.rows[0]?.username || 'Unknown', isPrivate === 'true' || isPrivate === true]);
        res.json({ success: true, message: 'Конфиг загружен!' });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка загрузки' }); 
    }
});

app.get('/api/configs/my', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ success: false, message: 'Не авторизован' });
    try {
        const result = await pool.query('SELECT id, name, description, author_name as author, private, downloads FROM configs WHERE author_id = $1 ORDER BY created_at DESC', [req.session.userId]);
        res.json({ success: true, configs: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: 'Ошибка' }); }
});

app.get('/api/configs/search', async (req, res) => {
    const { q } = req.query;
    try {
        const result = q 
            ? await pool.query(`SELECT id, name, description, author_name as author, downloads FROM configs WHERE private = FALSE AND (name ILIKE $1 OR author_name ILIKE $1) ORDER BY downloads DESC LIMIT 50`, [`%${q}%`])
            : await pool.query(`SELECT id, name, description, author_name as author, downloads FROM configs WHERE private = FALSE ORDER BY created_at DESC LIMIT 50`);
        res.json({ success: true, configs: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: 'Ошибка' }); }
});

app.get('/api/configs/download/:id', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Не авторизован' });
    
    // Проверка подписки
    const userResult = await pool.query('SELECT subscription_type, subscription_expires FROM users WHERE uid = $1', [userId]);
    const user = userResult.rows[0];
    let hasSub = false;
    if (user?.subscription_type === 'lifetime') hasSub = true;
    else if (user?.subscription_expires && new Date(user.subscription_expires) > new Date()) hasSub = true;
    
    if (!hasSub) return res.status(403).json({ success: false, message: 'Нужна активная подписка' });
    
    try {
        const result = await pool.query('SELECT * FROM configs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Конфиг не найден' });
        const config = result.rows[0];
        if (config.private && config.author_id !== userId) return res.status(403).json({ success: false, message: 'Нет доступа' });
        await pool.query('UPDATE configs SET downloads = downloads + 1 WHERE id = $1', [req.params.id]);
        
        // Отдаём содержимое из базы данных
        if (config.content) {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment; filename="' + config.name + '.json"');
            res.send(config.content);
        } else {
            return res.status(404).json({ success: false, message: 'Конфиг повреждён, перезагрузите его' });
        }
    } catch (err) { 
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' }); 
    }
});

app.delete('/api/configs/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ success: false, message: 'Не авторизован' });
    try {
        const result = await pool.query('SELECT * FROM configs WHERE id = $1 AND author_id = $2', [req.params.id, req.session.userId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Не найден' });
        await pool.query('DELETE FROM configs WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Удалён' });
    } catch (err) { res.status(500).json({ success: false, message: 'Ошибка' }); }
});

// ========================================
// API ДЛЯ MEDIA КОНФИГОВ
// ========================================

// Загрузка media конфига (только для роли media)
app.post('/api/media-configs/upload', upload.single('file'), async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ success: false, message: 'Не авторизован' });
    
    // Проверка роли
    const userResult = await pool.query('SELECT username, role FROM users WHERE uid = $1', [req.session.userId]);
    if (!userResult.rows[0] || userResult.rows[0].role !== 'media') {
        return res.status(403).json({ success: false, message: 'Нет доступа. Нужна роль Media' });
    }
    
    if (!req.file) return res.status(400).json({ success: false, message: 'Файл не загружен' });
    const { name, description, promo_code } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Введите название' });
    
    try {
        await pool.query(
            'INSERT INTO media_configs (name, description, filename, author_id, author_name, promo_code) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, description || '', req.file.filename, req.session.userId, userResult.rows[0].username, promo_code || null]
        );
        res.json({ success: true, message: 'Media конфиг загружен!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка загрузки' });
    }
});

// Получить все media конфиги (для маркетплейса)
app.get('/api/media-configs', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, description, author_name, price, funpay_url, promo_code, downloads FROM media_configs ORDER BY created_at DESC'
        );
        res.json({ success: true, configs: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка' });
    }
});

// Админ: получить все media конфиги для управления
app.get('/api/admin/media-configs', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM media_configs ORDER BY created_at DESC'
        );
        res.json({ success: true, configs: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка' });
    }
});

// Админ: обновить цену и ссылку FunPay для media конфига
app.post('/api/admin/media-configs/update', async (req, res) => {
    const { id, price, funpay_url } = req.body;
    try {
        await pool.query(
            'UPDATE media_configs SET price = $1, funpay_url = $2 WHERE id = $3',
            [price || 0, funpay_url || null, id]
        );
        res.json({ success: true, message: 'Обновлено' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка' });
    }
});

// Админ: удалить media конфиг
app.delete('/api/admin/media-configs/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT filename FROM media_configs WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) {
            const filePath = path.join(configsDir, result.rows[0].filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await pool.query('DELETE FROM media_configs WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка' });
    }
});
