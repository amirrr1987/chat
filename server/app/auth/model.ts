import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  fName: String,
  lName: String,
  mobile: String,
  email: String,
  password: String,
})
export default model('user', userSchema)