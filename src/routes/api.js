const express =                 require('express');
const multer =                  require('multer');
const { v4: uuidv4 } =          require('uuid');
const { s3, BUCKET_NAME } =     require('../db/vultr'); // Импортируем Vultr настройки
const { ObjectId } =            require('mongodb');

const upload = multer(); // Используем multer для обработки файлов
const router = express.Router(); // Создаем объект router

module.exports = (db, checkJwt) => {
    const collection = db.collection('example'); // Название коллекции
    const projectsCollection = db.collection('projects'); // Коллекция проектов

    // Пример защищенного маршрута для получения проектов пользователя
    router.get('/glav', checkJwt, async (req, res) => {
        try {
            const userId = req.auth?.sub; // Извлекаем user_id из токена
            if (!userId) {
                console.error('Unauthorized access: No user ID in token');
                return res.status(401).json({ status: 'error', message: 'Unauthorized' });
            }

            const projects = await projectsCollection.find({ user_id: userId }).toArray();
            const projectsList = projects.map(project => ({
                ...project,
                _id: project._id.toString(), // Преобразуем ObjectId в строку
            }));

            console.log('Projects for user:', userId);
            res.json({ status: 'success', user_id: userId, projects: projectsList });
        } catch (err) {
            console.error('Error fetching projects:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });

    



    




    

    return router;
};