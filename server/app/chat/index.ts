import { log } from "console";
import express from "express";
import http from 'http'
import { Server, Socket } from "socket.io";
import cors from 'cors'

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

    socket.on('sendMessage', (data: any) => {
        const message = {
            text: data.text,
            userId: socket.id
        }
        log(message)
        io.emit('message', message)
    })
    socket.on('disconnect', () => log('user disconnect'))
})

export default server