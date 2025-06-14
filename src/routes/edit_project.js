const express =             require('express');
const router =              express.Router();
const multer =              require('multer');
const { v4: uuidv4 } =      require('uuid');
const { s3, BUCKET_NAME } = require('../db/vultr'); // Импортируем Vultr настройки
const { ObjectId } =        require('mongodb');



const upload = multer(); // Используем multer для обработки файлов

module.exports = (db, checkJwt) => {
    const projectsCollection = db.collection('projects'); // Коллекция проектов
    const vitrineCollection = db.collection('vitrine'); // Коллекция витрины


    router.get('/:project_id', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];
        if (!user_email) {
            console.error('Unauthorized access: No user email in token');
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email: user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Преобразуем ObjectId в строку для JSON
            project._id = project._id.toString();

            console.log(`Fetching project with ID: ${project_id}`, project);

            // Возвращаем данные о проекте
            res.status(200).json({ status: 'success', project });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error fetching project:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });

    router.post('/:project_id/add_section', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];
    
        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }
    
        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);
    
            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }
    
            // Получаем имя нового раздела из тела запроса
            const { section_name } = req.body;
            if (!section_name) {
                return res.status(400).json({ status: 'error', message: 'Section name is required' });
            }
    
            // Добавляем новый раздел в проект
            const result = await projectsCollection.updateOne(
                { _id: objectId },
                { $set: { [`sections.${section_name}`]: {} } }
            );
    
            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Project not found or section not added' });
            }
    
            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();
            console.log(`Section "${section_name}" added to project with ID: ${project_id}`, updatedProject);
            res.status(200).json({
                status: 'success',
                message: 'Section added successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error adding section:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });

    
    router.post('/:project_id/add_subsection', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];

        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Получаем данные из тела запроса
            const { section_name, subsection_name } = req.body;
            if (!section_name || !subsection_name) {
                return res.status(400).json({ status: 'error', message: 'Section name and Subsection name are required' });
            }

            // Добавляем новый подраздел в выбранный раздел
            const result = await projectsCollection.updateOne(
                { _id: objectId },
                { $set: { [`sections.${section_name}.${subsection_name}`]: {} } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Project or section not found' });
            }

            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();
            
            console.log(`Subsection "${subsection_name}" added to section "${section_name}" in project with ID: ${project_id}`, updatedProject);
            res.status(200).json({
                status: 'success',
                message: 'Subsection added successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error adding subsection:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/add_element', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];
        
        // Проверка подлинности клиента
        if (!user_email) {
            console.error('Unauthorized access: No user email in token');
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                console.error('Unauthorized access: No project found for user');
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Получаем данные из тела запроса
            const { section, subsection, element_name } = req.body;
            console.log('Request body:', req.body); // Логируем тело запроса для отладки
            if (!section || !subsection || !element_name) {
                console.error('Error adding element: Missing required fields');
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }

            // Добавляем новый элемент в указанный подраздел
            const result = await projectsCollection.updateOne(
                { _id: objectId },
                { $set: { [`sections.${section}.${subsection}.${element_name}`]: { images: [], steps: [] } } }
            );

            if (result.modifiedCount === 0) {
                сonsole.error('Error adding element:', err);
                return res.status(404).json({ status: 'error', message: 'Project, section, or subsection not found' });
            }

            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();

            console.log(`Element "${element_name}" added to subsection "${subsection}" in section "${section}" of project with ID: ${project_id}`, updatedProject);
            res.status(200).json({
                status: 'success',
                message: 'Element added successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                сonsole.error('Error adding element:', err);
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error adding element:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/add_step', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];

        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }
    
        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);
    
            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                console.error('Unauthorized access: No project found for user');
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }
    
            // Получаем данные из тела запроса
            const { section, subsection, element, step_description } = req.body;
            if (!section || !subsection || !element || !step_description) {
                console.error('Error adding step: Missing required fields');
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }
    
            // Добавляем шаг в указанный элемент
            const result = await projectsCollection.updateOne(
                { _id: objectId, [`sections.${section}.${subsection}.${element}`]: { $exists: true } },
                { $push: { [`sections.${section}.${subsection}.${element}.steps`]: step_description } }
            );
    
            if (result.modifiedCount === 0) {
                console.error('Error adding step:', err);
                return res.status(404).json({ status: 'error', message: 'Project, section, subsection, or element not found' });
            }
    
            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();
            
            console.log(`Step "${step_description}" added to element "${element}" in subsection "${subsection}" of section "${section}" in project with ID: ${project_id}`, updatedProject);
            res.status(200).json({
                status: 'success',
                message: 'Step added successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                console.error('Error adding step:', err);
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error adding step:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/remove_step', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];

        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Получаем данные из тела запроса
            const { section, subsection, element, step_description } = req.body;
            if (!section || !subsection || !element || !step_description) {
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }

            // Удаляем шаг из указанного элемента
            const result = await projectsCollection.updateOne(
                { _id: objectId, [`sections.${section}.${subsection}.${element}.steps`]: step_description },
                { $pull: { [`sections.${section}.${subsection}.${element}.steps`]: step_description } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Step not found' });
            }

            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();

            res.status(200).json({
                status: 'success',
                message: 'Step removed successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error removing step:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/remove_element', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];

        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Получаем данные из тела запроса
            const { section, subsection, element_name } = req.body;
            if (!section || !subsection || !element_name) {
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }

            // Удаляем элемент из указанного подраздела
            const result = await projectsCollection.updateOne(
                { _id: objectId },
                { $unset: { [`sections.${section}.${subsection}.${element_name}`]: "" } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Element not found' });
            }

            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();

            res.status(200).json({
                status: 'success',
                message: 'Element removed successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error removing element:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/remove_subsection', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];

        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Получаем данные из тела запроса
            const { section_name, subsection_name } = req.body;
            if (!section_name || !subsection_name) {
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }

            // Удаляем подраздел из указанного раздела
            const result = await projectsCollection.updateOne(
                { _id: objectId },
                { $unset: { [`sections.${section_name}.${subsection_name}`]: "" } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Subsection not found' });
            }

            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();

            res.status(200).json({
                status: 'success',
                message: 'Subsection removed successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error removing subsection:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/remove_section', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];

        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Получаем данные из тела запроса
            const { section_name } = req.body;
            if (!section_name) {
                return res.status(400).json({ status: 'error', message: 'Section name is required' });
            }

            // Удаляем раздел из проекта
            const result = await projectsCollection.updateOne(
                { _id: objectId },
                { $unset: { [`sections.${section_name}`]: "" } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Section not found' });
            }

            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();

            res.status(200).json({
                status: 'success',
                message: 'Section removed successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error removing section:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/add_image', checkJwt, upload.single('image_upload'), async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];

        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Проверяем, что файл был загружен
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'No file uploaded' });
            }

            const { section, subsection, element } = req.body;
            if (!section || !subsection || !element) {
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }

            // Генерируем уникальное имя файла
            const fileKey = `${uuidv4()}-${req.file.originalname}`;

            // Загружаем файл в Vultr Object Storage
            const params = {
                Bucket: BUCKET_NAME,
                Key: fileKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read', // Делаем файл публично доступным
            };

            const uploadResult = await s3.upload(params).promise();

            // Сохраняем ссылку на изображение в базе данных
            const imageUrl = uploadResult.Location;
            const result = await projectsCollection.updateOne(
                { _id: objectId, [`sections.${section}.${subsection}.${element}`]: { $exists: true } },
                { $push: { [`sections.${section}.${subsection}.${element}.images`]: imageUrl } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Element not found' });
            }

            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();

            res.status(200).json({
                status: 'success',
                message: 'Image uploaded successfully',
                image_url: imageUrl,
                updated_project: updatedProject,
            });
        } catch (err) {
            console.error('Error uploading image:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/remove_image', checkJwt, async (req, res) => {
        const { project_id } = req.params; // Получаем project_id из параметров маршрута
        const user_email = req.auth?.['https://verboat.com/email'];

        // Проверка подлинности клиента
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            // Проверяем, что project_id имеет корректный формат ObjectId
            const objectId = new ObjectId(project_id);

            // Проверяем, что текущий пользователь является владельцем проекта
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            // Получаем данные из тела запроса
            const { section, subsection, element, image } = req.body;
            if (!section || !subsection || !element || !image) {
                return res.status(400).json({ status: 'error', message: 'Missing required fields' });
            }

            // Удаляем изображение из указанного элемента
            const result = await projectsCollection.updateOne(
                { _id: objectId, [`sections.${section}.${subsection}.${element}.images`]: image },
                { $pull: { [`sections.${section}.${subsection}.${element}.images`]: image } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Image not found' });
            }

            // Получаем обновленный проект
            const updatedProject = await projectsCollection.findOne({ _id: objectId });
            updatedProject._id = updatedProject._id.toString();

            res.status(200).json({
                status: 'success',
                message: 'Image removed successfully',
                updated_project: updatedProject,
            });
        } catch (err) {
            if (err.name === 'BSONTypeError') {
                return res.status(400).json({ status: 'error', message: 'Invalid project_id' });
            }
            console.error('Error removing image:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    router.post('/:project_id/add_main_image', checkJwt, upload.single('image_upload'), async (req, res) => {
        const { project_id } = req.params;
        const user_email = req.auth?.['https://verboat.com/email'];

        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }
    
        try {
            const objectId = new ObjectId(project_id);
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }
        
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'No file uploaded' });
            }
        
            const fileKey = `${uuidv4()}-${req.file.originalname}`;
            const params = {
                Bucket: BUCKET_NAME,
                Key: fileKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read',
            };
        
            const uploadResult = await s3.upload(params).promise();
            const imageUrl = uploadResult.Location;
        
            const result = await projectsCollection.updateOne(
                { _id: objectId },
                { $push: { main_image: imageUrl } }
            );
        
            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Project not found' });
            }
        
            res.status(200).json({
                status: 'success',
                message: 'Image uploaded successfully',
                image_url: imageUrl,
            });
            } catch (err) {
            console.error('Error uploading main image:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
            }
        });

    router.post('/:project_id/remove_main_image', checkJwt, async (req, res) => {
        const { project_id } = req.params;
        const user_email = req.auth?.['https://verboat.com/email'];

        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }
    
        try {
            const objectId = new ObjectId(project_id);
            const project = await projectsCollection.findOne({ _id: objectId, user_email });
            if (!project) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }
    
            const { image } = req.body;
            if (!image) {
                return res.status(400).json({ status: 'error', message: 'Image URL is required' });
            }
    
            const result = await projectsCollection.updateOne(
                { _id: objectId },
                { $pull: { main_image: image } }
            );
    
            if (result.modifiedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Image not found' });
            }
    
            res.status(200).json({
                status: 'success',
                message: 'Image removed successfully',
            });
            } catch (err) {
            console.error('Error removing main image:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
            }
        });



    router.post('/:project_id/update_description', checkJwt, async (req, res) => {
        const { project_id } = req.params;
        const user_email = req.auth?.['https://verboat.com/email'];

        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        try {
            const objectId = new ObjectId(project_id);
            const project = await projectsCollection.findOne({ _id: objectId, user_email });

            if (!project) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized access or project not found' });
            }

            const { description } = req.body;
            if (!description) {
            return res.status(400).json({ status: 'error', message: 'Description is required' });
            }

            const result = await projectsCollection.updateOne(
            { _id: objectId },
            { $set: { description } }
            );

            if (result.modifiedCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Project not found or description not updated' });
            }

            res.status(200).json({ status: 'success', message: 'Description updated successfully' });
        } catch (err) {
            console.error('Error updating description:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
        });




    router.post('/upsert_project/:project_id', checkJwt, async (req, res) => {
        const user_email = req.auth?.['https://verboat.com/email'];
        const projectId = req.params.project_id;

        if (!user_email) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        try {
        // Проверяем, что пользователь владелец проекта
        const project = await projectsCollection.findOne({ _id: new ObjectId(projectId), user_email });
        if (!project) {
            return res.status(403).json({ status: 'error', message: 'You are not the owner of this project' });
        }

        // Формируем данные для vitrine
        const data = {
            ...req.body,
            project_id: new ObjectId(projectId),
            access_list: [user_email],
            user_id: req.auth.sub,
            main_image: req.body.main_image || [],
        };

        // Проверяем, есть ли уже проект в vitrine
        const existing = await vitrineCollection.findOne({ project_id: new ObjectId(projectId) });

        if (existing) {
            // Обновляем
            await vitrineCollection.updateOne(
            { project_id: new ObjectId(projectId) },
            { $set: data }
            );
            return res.json({ status: 'success', message: 'Project updated in vitrine' });
        } else {
            // Добавляем новый
            await vitrineCollection.insertOne(data);
            return res.json({ status: 'success', message: 'Project added to vitrine' });
        }
        } catch (err) {
        console.error('Error upserting project in vitrine:', err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });


    
  return router;
};