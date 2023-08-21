import { log } from "console";
import express from "express";
import http from 'http'
import { Server, Socket } from "socket.io";
import cors from 'cors'
import model from "./model";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
})

// Enable CORS
app.use(cors());

io.on('connection', (socket: Socket) => {

    socket.on('sendMessage', async (data: any) => {
        io.emit('message', { ...data, socketId: socket.id })
        const x = await model.create(data)
        console.log(x);


    })
    socket.on('disconnect', () => log('user disconnect'))
})

export default server