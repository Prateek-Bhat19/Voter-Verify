const express = require('express');
const { getChatbotResponse, getChatHistory } = require('../controllers/chatbotController');
const { authMiddleware } = require('../middleware/authMiddleware');
const cors = require('cors');

const router = express.Router();

// Enable CORS for all routes in this router
router.use(cors());

// Get AI-powered chatbot response
router.post('/', getChatbotResponse);

// Get chat history for a specific room
router.get('/history/:roomId', authMiddleware, getChatHistory);

module.exports = router;
