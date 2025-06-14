require('dotenv').config(); // Подключение dotenv для работы с переменными окружения
const express =             require('express');
const path =                require('path');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa =             require('jwks-rsa');
const connectToDatabase =   require('./db/connect');
const apiProjects =         require('./routes/edit_project');
const cors =                require('cors');
const bodyParser =          require('body-parser');
const mainRouter =          require('./routes/router');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка Auth0
const authConfig = {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
};

// Middleware для проверки JWT
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
    }),
    audience: authConfig.audience,
    issuer: `https://${authConfig.domain}/`,
    algorithms: ['RS256'],
});

// Настройка CORS
app.use(cors({
    origin: 'http://localhost:5173', // Укажите адрес вашего фронтенда
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'], // Разрешаем заголовок Authorization
    credentials: false, // Не используем куки
}));
app.use(bodyParser.json()); // Для обработки JSON-запросов

// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next(); // Передаем управление следующему middleware или маршруту
});


process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


(async () => {
    const db = await connectToDatabase();

    app.use(express.static(path.join(__dirname, '../public')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    app.use('/api', mainRouter(db, checkJwt));

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})();