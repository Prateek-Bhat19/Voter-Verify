const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional to allow anonymous messages
  },
  room: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: 'user'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage; 