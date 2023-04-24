const _ = require("lodash")
const UserModel = require("../models/user")
const { EventBus } = require("../utils");

class UserController {

  constructor() {
    EventBus.on("updateChatList", (data) => {
      this.updateChatList(data);
    })
  }

  async getOne(req, res) {
    let users = await UserModel.find()
    res.status(200).send({
      message: "users found",
      success: true,
      code: 200,
      data: users
    })

  }
  async postOne(req, res) {
    const data = _.pick(req.body, ["username", "password", "avatar"])
    let user = await UserModel.findOne({ username: data.username })
    if (user) {
      return res.status(401).send({
        message: 'User registered',
        success: false
      })
    }

    user = new UserModel(data)
    user = await user.save()
    res.send(user)
  }
  async putOne(req, res) { }
  async deleteOne(req, res) { }


  async updateChatList(data) {

    // let sender = await UserModel.findById(data.senderId);
    // const updatedChatBySenderId = await UserModel.findByIdAndUpdate(data.senderId, { 'chats.friendId': { $ne: data.getterId } },
    //   { "chats": { "$set": { 'friendId': data.getterId, 'chatId': data.chatId } } })


    const updatedChatBySenderId = await UserModel.findOneAndUpdate(
      { _id: data.senderId, "chats.friendId": { $ne: data.getterId } },
      { $push: { chats: { friendId: data.getterId, chatId: data.chatId } } },
      { new: true }
    );

    const updatedChatByGetterId = await UserModel.findOneAndUpdate(
      { _id: data.getterId, "chats.friendId": { $ne: data.senderId } },
      { $push: { chats: { friendId: data.senderId, chatId: data.chatId } } },
      { new: true }
    );

    // console.log(updatedChatBySenderId);


    // const existingChat = sender.chats.find(chat => chat.friendId.equals(data.getterId));



    // if (!existingChat) {
    //   sender.chats.push({ friendId: data.getterId, chatId: data.chatId })
    //   await sender.save();
    // }



  }
}

module.exports = new UserController()