const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Weather suggestion routes
router.post('/', weatherController.createWeatherSuggestion);
router.get('/autocomplete', weatherController.autocompleteLocation);
router.get('/current/:location', weatherController.getCurrentWeatherSuggestion);
router.get('/:userId', weatherController.getWeatherSuggestions);
router.put('/:id', weatherController.updateWeatherSuggestion);
router.delete('/:id', weatherController.deleteWeatherSuggestion);

module.exports = router;
