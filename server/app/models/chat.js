const mongoose = require("mongoose")

const MessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  senderId: {
    type: mongoose.Types.ObjectId,
    required: true
  }
})


const ChatSchema = new mongoose.Schema({
  messages: [MessageSchema]
})

module.exports = mongoose.model("Chat", ChatSchema)