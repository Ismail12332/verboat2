const express = require('express');
const router = express.Router();

module.exports = (db, checkJwt) => {

    const vitrineCollection = db.collection('vitrine');

    router.get('/vitrine', async (req, res) => {
        
        try {
            const projects = await vitrineCollection.find({}).toArray();
            const projectsList = projects.map(project => ({
                ...project,
                _id: project._id.toString(), // Преобразуем ObjectId в строку
            }));

            console.log('Projects fetched for vitrine:', projectsList);
            res.json({ status: 'success', projects: projectsList });
        } catch (err) {
            console.error('Error fetching projects for vitrine:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
        
    });

    return router;
};