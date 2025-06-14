const express =     require('express');
const router =      express.Router();
const { ObjectId } = require('mongodb');


module.exports = (db, checkJwt) => {

    const vitrineCollection = db.collection('vitrine');

    router.get('/yacht_preview/:id', async (req, res) => {
        
        const yachtId = req.params.id;
        if (!yachtId) {
            return res.status(400).json({ status: 'error', message: 'Yacht ID is required' });
        }

        try {
            const yacht = await vitrineCollection.findOne({ _id: new ObjectId(yachtId) });
            if (!yacht) {
                return res.status(404).json({ status: 'error', message: 'Yacht not found' });
            }

            // Преобразуем ObjectId в строку для ответа
            yacht._id = yacht._id.toString();
            console.log('Yacht preview fetched:', yacht);
            res.json({ status: 'success', yacht });
        } catch (err) {
            console.error('Error fetching yacht preview:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    });

    return router;
};