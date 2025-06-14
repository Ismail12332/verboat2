const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

module.exports = (db, checkJwt) => {
    const vitrineCollection = db.collection('vitrine');
    const projectsCollection = db.collection('projects');

    // Проверка доступа и получение проекта по project_id
    router.get('/get_project/:project_id', checkJwt, async (req, res) => {
        const user_email = req.auth?.['https://verboat.com/email'];
        const projectId = req.params.project_id;

        if (!user_email) {
            console.error('Unauthorized access: No user email in token');
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        try {
            // 1. Найти проект в vitrine по project_id
            const vitrineProject = await vitrineCollection.findOne({ _id: new ObjectId(projectId) });
            if (!vitrineProject) {
                console.error('Project not found in vitrine for project_id:', projectId);
                return res.status(404).json({ status: 'error', message: 'Project not found in vitrine' });
            }

            // 2. Проверить доступ по email
            const accessList = vitrineProject.access_list || [];
            if (!accessList.includes(user_email)) {
                console.error('Access denied for user:', user_email, 'on project:', vitrineProject._id);
                return res.status(403).json({ status: 'error', message: 'Access denied' });
            }

            // 3. Получить project_id для поиска в projects
            const realProjectId = vitrineProject.project_id;
            if (!realProjectId) {
                console.error('No project_id found in vitrine for project:', vitrineProject._id);
                return res.status(404).json({ status: 'error', message: 'No project_id in vitrine' });
            }

            // 4. Найти проект в коллекции projects
            const project = await projectsCollection.findOne({ _id: new ObjectId(realProjectId) });
            if (!project) {
                console.error('Project not found in projects for project_id:', realProjectId);
                return res.status(404).json({ status: 'error', message: 'Project not found in projects' });
            }

            project._id = project._id.toString();
            console.log('project data', project);
            res.json({ status: 'success', project });
        } catch (err) {
            console.error('Error checking access and fetching project:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });

    return router;
};