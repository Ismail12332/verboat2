const express =                 require('express');
const router =                  express.Router();
const multer =                  require('multer');         
const upload =                  multer();                  
const { v4: uuidv4 } =          require('uuid');
const { s3, BUCKET_NAME } =     require('../db/vultr');
const { ObjectId } =            require('mongodb');

module.exports = (db, checkJwt) => {
    
    const projectsCollection = db.collection('projects'); // Коллекция проектов


     // Функция для генерации уникального кода проекта
    function generateRandomCode(length = 8) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    }

    async function generateUniqueCode(collection, length = 8) {
        while (true) {
            const code = generateRandomCode(length);
            const existingProject = await collection.findOne({ project_code: code });
            if (!existingProject) {
                return code;
            }
        }
    }

    router.get('/main', checkJwt, async (req, res) => {
        const user_email = req.auth?.['https://verboat.com/email'];
        if (!user_email) {
            console.error('Unauthorized access: No user email in token');
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        try {
            const projects = await projectsCollection.find({ user_email }).toArray();
            const projectsList = projects.map(project => ({
                ...project,
                _id: project._id.toString(), // Преобразуем ObjectId в строку
            }));

            console.log('Projects for user:', user_email);
            res.json({ status: 'success', user_email, projects: projectsList });
        } catch (err) {
            console.error('Error fetching projects:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/create_project', checkJwt, upload.single('main_image'), async (req, res) => {
        try {
            const user_email = req.auth?.['https://verboat.com/email'];
            if (!user_email) {
                console.error('Unauthorized access: No user email in token');
                return res.status(401).json({ status: 'error', message: 'Unauthorized' });
            }

            const data = req.body; // Получаем данные из тела запроса
            const projectCode = await generateUniqueCode(projectsCollection); // Генерируем уникальный код проекта

            // Проверяем, что файл был загружен
            let mainImageUrl = null;
            if (req.file) {
                const fileKey = `${uuidv4()}-${req.file.originalname}`;
                const params = {
                    Bucket: BUCKET_NAME,
                    Key: fileKey,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                    ACL: 'public-read', // Делаем файл публично доступным
                };

                const uploadResult = await s3.upload(params).promise();
                mainImageUrl = uploadResult.Location; // Сохраняем URL изображения
            }

            // Создаем объект проекта
            const project = {
                user_email: user_email,
                boat_make: data.boat_make,
                boat_model: data.boat_model,
                boat_registration: data.boat_registration,
                length: data.length,
                year: data.year,
                engine: data.engine,
                price: data.price,
                city: data.city,
                owner_contact: data.owner_contact,
                created_at: new Date().toISOString(),
                project_code: projectCode,
                main_image: mainImageUrl ? [mainImageUrl] : [], // Сохраняем изображение как массив
                sections: {
                    Introduction: {
                        gen_info: {},
                        certification: {},
                        purpose_of_survey: {},
                        circumstances_of_survey: {},
                        report_file_no: {},
                        surveyor_qualifications: {},
                        intended_use: {},
                    },
                    Hull: {
                        layout_overview: {},
                        design: {},
                        deck: {},
                        structural_members: {},
                        bottom_paint: {},
                        blister_comment: {},
                        transom: {},
                    },
                },
            };

            // Вставляем проект в базу данных
            const result = await projectsCollection.insertOne(project);

            console.log('Project added:', project);
            res.status(201).json({ status: 'success', project_id: result.insertedId, project });
        } catch (err) {
            console.error('Error creating project:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    

    return router;
};