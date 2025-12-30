// Система переводов VodkaClient
const translations = {
    ru: {
        // Навигация
        'nav.home': 'Главная',
        'nav.marketplace': 'Маркетплейс',
        'nav.support': 'Поддержка',
        'nav.download': 'Скачать лаунчер',
        'nav.buy': 'Купить',
        'nav.login': 'Войти в кабинет',
        
        // Hero секция
        'hero.subtitle': 'Выведи игру на новый уровень',
        'hero.about': 'О нас',
        'hero.description': 'Мы предоставляем вам лучший клиент для комфортной игры, который даст вам наилучшие впечатления от игры.',
        'hero.watch': 'Смотреть',
        'hero.details': 'Подробнее',
        
        // Преимущества
        'features.title': 'Наши преимущества',
        'features.subtitle': 'Мы кратко изложили вам то, что вы гарантированно получите после покупки нашего клиента.',
        'features.design.title': 'Красивый внешний вид',
        'features.design.desc': 'В нашем клиенте присутствует большое количество визуальных функций, которые сделают вашу игру более красочной.',
        'features.customization.title': 'Настраиваемость',
        'features.customization.desc': 'В нашем клиенте вы можете настроить практически любую функцию под себя.',
        'features.optimization.title': 'Оптимизация',
        'features.optimization.desc': 'Мы постоянно улучшаем оптимизацию нашего клиента с самой первой версии.',
        'features.updates.title': 'Частые обновления',
        'features.updates.desc': 'Мы регулярно обновляем функционал в нашем клиенте, добавляя новые функции.',
        'features.support.title': 'Лучшая поддержка',
        'features.support.desc': 'У нас самая лучшая поддержка, которая разбирается в своем деле.',
        'features.usability.title': 'Удобство использования',
        'features.usability.desc': 'Наш клиент разработан с учетом удобства использования.',
        
        // Кабинет
        'cabinet.loading': 'Загрузка...',
        'cabinet.subscription': 'Подписка',
        'cabinet.notActive': 'Не активна',
        'cabinet.download': 'Скачать лаунчер',
        'cabinet.username': 'Имя пользователя',
        'cabinet.email': 'E-Mail',
        'cabinet.hwid': 'HWID',
        'cabinet.hwidNotLinked': 'Не привязан',
        'cabinet.role': 'Роль',
        'cabinet.betaAccess': 'Бета доступ',
        'cabinet.yes': 'Да',
        'cabinet.no': 'Нет',
        'cabinet.actions': 'Действия',
        'cabinet.configureRam': 'Настроить RAM',
        'cabinet.configure': 'Настроить',
        'cabinet.activateKey': 'Активировать ключ',
        'cabinet.activate': 'Активировать',
        'cabinet.changeAvatar': 'Сменить аватар',
        'cabinet.change': 'Сменить',
        'cabinet.changePassword': 'Сменить пароль',
        'cabinet.logout': 'Выйти из аккаунта',
        'cabinet.keyActivation': 'Активация ключа',
        'cabinet.cancel': 'Отмена',
        'cabinet.passwordChange': 'Смена пароля',
        'cabinet.currentPassword': 'Текущий пароль',
        'cabinet.newPassword': 'Новый пароль (мин. 6 символов)',
        'cabinet.ramSettings': 'Настройка RAM',
        'cabinet.save': 'Сохранить',
        'cabinet.avatarChange': 'Смена аватара',
        'cabinet.inDevelopment': 'Функция в разработке',
        'cabinet.close': 'Закрыть',
        
        // Маркетплейс
        'market.menu': 'Меню',
        'market.home': 'Главная',
        'market.myConfigs': 'Мои конфиги',
        'market.saved': 'Сохранённые',
        'market.fromDevs': 'От разработчиков',
        'market.fromMedia': 'От Media',
        'market.upload': 'Загрузить',
        'market.search': 'Найти',
        'market.searchPlaceholder': 'Название или автор...',
        'market.welcome': 'Добро пожаловать в Marketplace!',
        'market.noConfigs': 'У вас пока нет загруженных конфигов',
        'market.uploadFirst': 'Загрузить первый конфиг',
        'market.noSaved': 'Нет сохранённых конфигов',
        'market.uploadConfig': 'Загрузить конфиг',
        'market.configName': 'Название конфига',
        'market.description': 'Описание',
        'market.privateConfig': 'Приватный конфиг (только для меня)',
        'market.dragHere': 'Перетащите конфиг сюда',
        'market.orClick': 'или нажмите для выбора файла',
        'market.downloading': 'Загрузка...'
    },
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.marketplace': 'Marketplace',
        'nav.support': 'Support',
        'nav.download': 'Download Launcher',
        'nav.buy': 'Buy',
        'nav.login': 'Login',
        
        // Hero section
        'hero.subtitle': 'Take your game to the next level',
        'hero.about': 'About Us',
        'hero.description': 'We provide you with the best client for comfortable gaming that will give you the best gaming experience.',
        'hero.watch': 'Watch',
        'hero.details': 'Learn More',
        
        // Features
        'features.title': 'Our Advantages',
        'features.subtitle': 'We have briefly outlined what you are guaranteed to get after purchasing our client.',
        'features.design.title': 'Beautiful Design',
        'features.design.desc': 'Our client has a large number of visual features that will make your game more colorful.',
        'features.customization.title': 'Customization',
        'features.customization.desc': 'In our client you can customize almost any function to your liking.',
        'features.optimization.title': 'Optimization',
        'features.optimization.desc': 'We are constantly improving the optimization of our client since the very first version.',
        'features.updates.title': 'Frequent Updates',
        'features.updates.desc': 'We regularly update the functionality in our client, adding new features.',
        'features.support.title': 'Best Support',
        'features.support.desc': 'We have the best support team that knows their stuff.',
        'features.usability.title': 'Ease of Use',
        'features.usability.desc': 'Our client is designed with ease of use in mind.',
        
        // Cabinet
        'cabinet.loading': 'Loading...',
        'cabinet.subscription': 'Subscription',
        'cabinet.notActive': 'Not active',
        'cabinet.download': 'Download Launcher',
        'cabinet.username': 'Username',
        'cabinet.email': 'E-Mail',
        'cabinet.hwid': 'HWID',
        'cabinet.hwidNotLinked': 'Not linked',
        'cabinet.role': 'Role',
        'cabinet.betaAccess': 'Beta Access',
        'cabinet.yes': 'Yes',
        'cabinet.no': 'No',
        'cabinet.actions': 'Actions',
        'cabinet.configureRam': 'Configure RAM',
        'cabinet.configure': 'Configure',
        'cabinet.activateKey': 'Activate Key',
        'cabinet.activate': 'Activate',
        'cabinet.changeAvatar': 'Change Avatar',
        'cabinet.change': 'Change',
        'cabinet.changePassword': 'Change Password',
        'cabinet.logout': 'Logout',
        'cabinet.keyActivation': 'Key Activation',
        'cabinet.cancel': 'Cancel',
        'cabinet.passwordChange': 'Change Password',
        'cabinet.currentPassword': 'Current password',
        'cabinet.newPassword': 'New password (min. 6 characters)',
        'cabinet.ramSettings': 'RAM Settings',
        'cabinet.save': 'Save',
        'cabinet.avatarChange': 'Change Avatar',
        'cabinet.inDevelopment': 'Feature in development',
        'cabinet.close': 'Close',
        
        // Marketplace
        'market.menu': 'Menu',
        'market.home': 'Home',
        'market.myConfigs': 'My Configs',
        'market.saved': 'Saved',
        'market.fromDevs': 'From Developers',
        'market.fromMedia': 'From Media',
        'market.upload': 'Upload',
        'market.search': 'Search',
        'market.searchPlaceholder': 'Name or author...',
        'market.welcome': 'Welcome to Marketplace!',
        'market.noConfigs': 'You have no uploaded configs yet',
        'market.uploadFirst': 'Upload first config',
        'market.noSaved': 'No saved configs',
        'market.uploadConfig': 'Upload Config',
        'market.configName': 'Config name',
        'market.description': 'Description',
        'market.privateConfig': 'Private config (only for me)',
        'market.dragHere': 'Drag config here',
        'market.orClick': 'or click to select file',
        'market.downloading': 'Loading...'
    },
    ua: {
        // Навігація
        'nav.home': 'Головна',
        'nav.marketplace': 'Маркетплейс',
        'nav.support': 'Підтримка',
        'nav.download': 'Завантажити лаунчер',
        'nav.buy': 'Купити',
        'nav.login': 'Увійти в кабінет',
        
        // Hero секція
        'hero.subtitle': 'Виведи гру на новий рівень',
        'hero.about': 'Про нас',
        'hero.description': 'Ми надаємо вам найкращий клієнт для комфортної гри, який дасть вам найкращі враження від гри.',
        'hero.watch': 'Дивитись',
        'hero.details': 'Детальніше',
        
        // Переваги
        'features.title': 'Наші переваги',
        'features.subtitle': 'Ми коротко виклали вам те, що ви гарантовано отримаєте після покупки нашого клієнта.',
        'features.design.title': 'Гарний зовнішній вигляд',
        'features.design.desc': 'У нашому клієнті присутня велика кількість візуальних функцій, які зроблять вашу гру більш барвистою.',
        'features.customization.title': 'Налаштовуваність',
        'features.customization.desc': 'У нашому клієнті ви можете налаштувати практично будь-яку функцію під себе.',
        'features.optimization.title': 'Оптимізація',
        'features.optimization.desc': 'Ми постійно покращуємо оптимізацію нашого клієнта з самої першої версії.',
        'features.updates.title': 'Часті оновлення',
        'features.updates.desc': 'Ми регулярно оновлюємо функціонал у нашому клієнті, додаючи нові функції.',
        'features.support.title': 'Найкраща підтримка',
        'features.support.desc': 'У нас найкраща підтримка, яка розбирається у своїй справі.',
        'features.usability.title': 'Зручність використання',
        'features.usability.desc': 'Наш клієнт розроблений з урахуванням зручності використання.',
        
        // Кабінет
        'cabinet.loading': 'Завантаження...',
        'cabinet.subscription': 'Підписка',
        'cabinet.notActive': 'Не активна',
        'cabinet.download': 'Завантажити лаунчер',
        'cabinet.username': "Ім'я користувача",
        'cabinet.email': 'E-Mail',
        'cabinet.hwid': 'HWID',
        'cabinet.hwidNotLinked': "Не прив'язаний",
        'cabinet.role': 'Роль',
        'cabinet.betaAccess': 'Бета доступ',
        'cabinet.yes': 'Так',
        'cabinet.no': 'Ні',
        'cabinet.actions': 'Дії',
        'cabinet.configureRam': 'Налаштувати RAM',
        'cabinet.configure': 'Налаштувати',
        'cabinet.activateKey': 'Активувати ключ',
        'cabinet.activate': 'Активувати',
        'cabinet.changeAvatar': 'Змінити аватар',
        'cabinet.change': 'Змінити',
        'cabinet.changePassword': 'Змінити пароль',
        'cabinet.logout': 'Вийти з акаунту',
        'cabinet.keyActivation': 'Активація ключа',
        'cabinet.cancel': 'Скасувати',
        'cabinet.passwordChange': 'Зміна пароля',
        'cabinet.currentPassword': 'Поточний пароль',
        'cabinet.newPassword': 'Новий пароль (мін. 6 символів)',
        'cabinet.ramSettings': 'Налаштування RAM',
        'cabinet.save': 'Зберегти',
        'cabinet.avatarChange': 'Зміна аватара',
        'cabinet.inDevelopment': 'Функція в розробці',
        'cabinet.close': 'Закрити',
        
        // Маркетплейс
        'market.menu': 'Меню',
        'market.home': 'Головна',
        'market.myConfigs': 'Мої конфіги',
        'market.saved': 'Збережені',
        'market.fromDevs': 'Від розробників',
        'market.fromMedia': 'Від Media',
        'market.upload': 'Завантажити',
        'market.search': 'Знайти',
        'market.searchPlaceholder': 'Назва або автор...',
        'market.welcome': 'Ласкаво просимо до Marketplace!',
        'market.noConfigs': 'У вас поки немає завантажених конфігів',
        'market.uploadFirst': 'Завантажити перший конфіг',
        'market.noSaved': 'Немає збережених конфігів',
        'market.uploadConfig': 'Завантажити конфіг',
        'market.configName': 'Назва конфіга',
        'market.description': 'Опис',
        'market.privateConfig': 'Приватний конфіг (тільки для мене)',
        'market.dragHere': 'Перетягніть конфіг сюди',
        'market.orClick': 'або натисніть для вибору файлу',
        'market.downloading': 'Завантаження...'
    }
};

const langNames = { ru: 'Русский', en: 'English', ua: 'Українська' };

function setLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
    document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
    localStorage.setItem('vodka-lang', lang);
}

function getCurrentLang() {
    return localStorage.getItem('vodka-lang') || 'ru';
}

function t(key) {
    const lang = getCurrentLang();
    return translations[lang] && translations[lang][key] ? translations[lang][key] : key;
}

// Автоматическое применение языка при загрузке
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = getCurrentLang();
    if (savedLang !== 'ru') {
        setLanguage(savedLang);
    }
});
