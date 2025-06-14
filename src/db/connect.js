const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://127.0.0.1:27017'; // Локальный адрес MongoDB
const client = new MongoClient(MONGO_URI);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('my_database'); // Название вашей базы данных
        return db;
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

module.exports = connectToDatabase;