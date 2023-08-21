import Application from './app'
const port = {
  app: 5000,
  chat:4000
}
const database = 'mongodb://localhost:27017/userChat';
new Application({ port, database })