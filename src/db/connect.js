const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI; // Используем переменную окружения
const client = new MongoClient(MONGO_URI);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(); // Если имя базы указано в URI, можно не указывать
        return db;
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

module.exports = connectToDatabase;