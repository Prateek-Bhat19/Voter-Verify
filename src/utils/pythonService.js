const axios = require('axios');
const config = require('../config');

const pythonService = axios.create({
    baseURL: config.pythonService.url,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.pythonService.apiKey
    }
});

module.exports = {
    verifyFace: async (imageData) => {
        try {
            const response = await pythonService.post('/verify-face', {
                image: imageData
            });
            return response.data;
        } catch (error) {
            console.error('Error calling Python service:', error.message);
            throw error;
        }
    },

    compareFaces: async (image1, image2) => {
        try {
            const response = await pythonService.post('/compare-faces', {
                image1,
                image2
            });
            return response.data;
        } catch (error) {
            console.error('Error calling Python service:', error.message);
            throw error;
        }
    }
}; 