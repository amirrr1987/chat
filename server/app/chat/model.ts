import { Schema, model } from 'mongoose'

const messageSchema = new Schema({
    userId: String,
    chatId: String,
    message: String,
})
export default model('message', messageSchema)