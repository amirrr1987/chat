const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  chats: [{
    friendId: mongoose.Types.ObjectId,
    chatId: mongoose.Types.ObjectId
  }]
})

module.exports = mongoose.model("User", UserSchema)