const express           = require('express');
const router            = express.Router();
const editProjectRoutes = require('./edit_project');
const myBoatsRoutes     = require('./my_boats');
const buyYachtRoutes    = require('./buy_yacht');
const addSurveyRoutes   = require('./add_survey');
const yachtPreviewRoutes = require('./yacht_preview');
const surveyPageRoutes = require('./survey');

module.exports = (db, checkJwt) => {
    router.use('/edit_project', editProjectRoutes(db, checkJwt));
    router.use('/my_boats', myBoatsRoutes(db, checkJwt));
    router.use('/buy_yacht', buyYachtRoutes(db, checkJwt));
    router.use('/add_survey', addSurveyRoutes(db, checkJwt));
    router.use('/yacht_preview', yachtPreviewRoutes(db, checkJwt));
    router.use('/survey', surveyPageRoutes(db, checkJwt));
    return router;
};