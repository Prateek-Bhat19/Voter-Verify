require('dotenv').config();
const axios = require('axios');
const ChatbotHistory = require('../models/chatbotModel');
const ChatMessage = require('../models/ChatMessage');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

exports.getChatbotResponse = async (req, res) => {
    try {
        // Check if API key is configured
        if (!GEMINI_API_KEY) {
            console.error("Gemini API key is not configured");
            return res.status(500).json({ 
                error: "Chatbot service is not properly configured",
                message: "Please contact the administrator"
            });
        }

        const { message, userId, roomId } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: "Message is required",
                message: "Please enter a message"
            });
        }

        // Create a room ID if not provided
        const chatRoomId = roomId || (userId ? `user_${userId}` : `guest_${Date.now()}`);

        const prompt = `You are an India-specific voter assistance chatbot. Your role is to help users with information about Indian elections and voting procedures. 
        Please provide accurate, helpful, and concise information in a clear, structured format.

        When explaining eligibility criteria or requirements, use bullet points or numbered lists.
        When providing step-by-step instructions, use numbered lists.
        When comparing options or listing features, use bullet points.
        
        Always format your responses with:
        - Clear headings using markdown (## for main headings, ### for subheadings)
        - Proper spacing between sections
        - Bullet points (•) for lists
        - Bold text (**text**) for important terms or requirements
        - Numbered lists (1., 2., etc.) for steps
        
        Focus on providing information about:
        - Voter registration process
        - Voter ID card
        - Election procedures
        - Polling booth locations
        - Voting rights and responsibilities
        - Election dates and schedules
        
        If the query is not related to Indian voting or elections, politely inform that you can only answer questions about Indian voter and voting processes.
        
        User's question: "${message}"`;

        try {
            const response = await axios.post(
                GEMINI_URL,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 500
                    }
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    timeout: 10000 // 10 second timeout
                }
            );

            if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
                console.error("Gemini API Error:", response.data);
                return res.status(500).json({ 
                    error: "Failed to generate response from AI",
                    message: "Please try again later"
                });
            }

            const reply = response.data.candidates[0].content.parts[0].text;

            if(!reply){
                return res.status(500).json({
                    error: "AI returned an empty response",
                    message: "Please try again later"
                });
            }

            // Save user message to ChatMessage model
            const userMessage = new ChatMessage({
                userId: userId || null,
                room: chatRoomId,
                text: message,
                sender: 'user'
            });
            await userMessage.save();

            // Save bot response to ChatMessage model
            const botResponse = new ChatMessage({
                userId: userId || null,
                room: chatRoomId,
                text: reply,
                sender: 'system'
            });
            await botResponse.save();

            // Also save to old ChatbotHistory model for backward compatibility
            const chatEntry = new ChatbotHistory({ userMessage: message, botResponse: reply });
            await chatEntry.save();

            res.json({ 
                success: true,
                reply,
                roomId: chatRoomId,
                messageId: botResponse._id
            });
        } catch (error) {
            console.error("Gemini API Error:", error.response?.data || error.message);
            
            if (error.code === 'ECONNABORTED') {
                return res.status(504).json({ 
                    error: "Request timeout",
                    message: "The AI service is taking too long to respond. Please try again."
                });
            }
            
            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        return res.status(400).json({ 
                            error: "Invalid request",
                            message: "Please try again with a different message"
                        });
                    case 401:
                        return res.status(500).json({ 
                            error: "AI service authentication failed",
                            message: "Please contact the administrator"
                        });
                    case 404:
                        return res.status(500).json({ 
                            error: "AI model not found",
                            message: "Please contact the administrator"
                        });
                    case 429:
                        return res.status(429).json({ 
                            error: "Too many requests",
                            message: "Please wait a moment and try again"
                        });
                    default:
                        return res.status(500).json({ 
                            error: "AI service error",
                            message: "Please try again later"
                        });
                }
            } else if (error.request) {
                return res.status(503).json({ 
                    error: "AI service is unavailable",
                    message: "Please try again later"
                });
            } else {
                return res.status(500).json({ 
                    error: "Internal server error",
                    message: "Please try again later"
                });
            }
        }
    } catch (error) {
        console.error("Chatbot Error:", error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: "Please try again later"
        });
    }
};

// Get chat history for a specific room
exports.getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 50 } = req.query;
        
        if (!roomId) {
            return res.status(400).json({ error: "Room ID is required" });
        }
        
        const messages = await ChatMessage.find({ room: roomId })
            .sort({ createdAt: 1 })
            .limit(parseInt(limit));
            
        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
};