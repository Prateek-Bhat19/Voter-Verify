const mongoose = require("mongoose");

const chatbotSchema = new mongoose.Schema({
    userMessage: { type: String, required: true },
    botResponse: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatbotHistory", chatbotSchema);
