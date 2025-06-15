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


const authConfig = {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
};


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


app.use(cors({
    origin: 'http://verboat.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'], 
    credentials: false,
}));
app.use(bodyParser.json()); 


app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next(); 
});


app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(err.status || 500).json({ status: 'error', message: err.message });
});


process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


(async () => {
    const db = await connectToDatabase();

    const distPath = path.join(__dirname, '../public/dist');
    app.use(express.static(distPath));

    app.get('/', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });

    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });

    app.use('/api', mainRouter(db, checkJwt));

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})();