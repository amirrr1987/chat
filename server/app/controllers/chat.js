const _ = require("lodash")
const ChatModel = require("../models/chat")
const { EventBus } = require("../utils");

class ChatController {
  async getOne(req, res) {
    const data = _.pick(req.params, ["getterId", "senderId"])
    console.log(data);

    ChatModel.findOne()


  }
  async postOne(req, res) {

    // res.send(req.body)

    const data = _.pick(req.body, ["senderId", "message"])


    let chat = new ChatModel({ messages: [data] })
    // console.log(chat);

    chat = await chat.save()
    EventBus.emit('updateChatList', { senderId: req.body.senderId, getterId: req.body.getterId, chatId: chat._id })



    res.status(201).send(chat)

    // let getter = await UserModel.findOne({ _id: getterId })


    // console.log(getter);
    // getter.chats.push(chat._id)
    // getter = await getter.save()

    // let sender = await UserModel.findById(senderId)
    // sender.chats.push(chat._id)
    // sender = await getter.save()



    // user.chatList.push(chat._id)

    // user = await user.save()
    // res.status(201).send({
    //   chat: chat._id
    // })


    // res.send({ getter })
  }
  async putOne(req, res) {
    res.send(req.body)
  }
  async deleteOne(req, res) { }
}

module.exports = new ChatController()


