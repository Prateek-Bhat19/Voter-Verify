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
                error: "Service configuration error",
                message: "Please try again later"
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

        const prompt = `You are an India-specific voter assistance chatbot. Your role is to provide accurate, helpful, and concise information about Indian elections and voting procedures.

IMPORTANT FORMATTING RULES:
1. NEVER use markdown headers (## or ###)
2. Start responses with a bold title using **text**
3. Use bullet points (•) for lists
4. Use numbered lists (1., 2., etc.) for steps
5. Highlight important terms in **bold**
6. Each point should be on a new line
7. Keep responses focused and specific
8. Never show welcome messages or topic lists

RESPONSE STRUCTURE:
1. Bold title summarizing the topic
2. Direct answer to the question
3. Key points in bullet format
4. Steps in numbered format (if applicable)
5. Important terms in bold
6. Official references (if needed)
7. Next steps or guidance

TOPICS:
• Voting systems (EVMs, VVPAT)
• Voter registration
• Voter ID cards
• Election procedures
• Polling booths
• Voting rights
• Election schedules
• Electoral roll
• ECI functions
• NRI voting
• Election laws
• Security measures

If the query is not about Indian voting, respond with:
> "I can only assist with questions related to Indian elections and voting processes."

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
                    error: "Service error",
                    message: "Please try again later"
                });
            }

            let reply = response.data.candidates[0].content.parts[0].text;
            
            // Clean up the response to remove any prompt text
            reply = reply.replace(prompt, '').trim();
            
            // If the response is empty after cleaning, return error
            if (!reply) {
                return res.status(500).json({ 
                    error: "Service error",
                    message: "Please try again later"
                });
            }

            // Save the conversation
            await saveConversation(userId, chatRoomId, message, reply);

            return res.status(200).json({ reply });
        } catch (error) {
            console.error("Gemini API Error:", error);
            return res.status(500).json({ 
                error: "Service error",
                message: "Please try again later"
            });
        }
    } catch (error) {
        console.error("Chatbot Error:", error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: "Please try again later"
        });
    }
};

// Helper function to save conversation
async function saveConversation(userId, roomId, message, reply) {
    try {
        const chatMessage = new ChatMessage({
            userId: userId || null,
            roomId,
            message,
            reply,
            timestamp: new Date()
        });
        await chatMessage.save();
    } catch (error) {
        console.error("Error saving conversation:", error);
    }
}

// Get chat history for a specific room
exports.getChatHistory = async (req, res) => {
    try {
        // Return empty array to prevent showing old messages
        res.json([]);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
};