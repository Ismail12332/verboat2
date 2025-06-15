const express = require('express');
const router = express.Router();

module.exports = (db, checkJwt) => {
    const projectsCollection = db.collection('projects');

    router.get('/', checkJwt, async (req, res) => {
        const user_email = req.auth?.['https://verboat.com/email'];
        if (!user_email) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        try {
            const projects = await projectsCollection.find({ user_email }).toArray();
            res.json({ status: 'success', projects });
        } catch (err) {
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });

    return router;
};