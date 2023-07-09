import { log } from "console";
import express, { Request, Response } from "express";
import http from 'http'
import { Server, Socket } from "socket.io";



const PORT = 4000
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
})



io.on('connection', (socket: Socket) => {



    socket.on('sendMessage', (data: any) => {
        const message = {
            text: data.text,
            userId : socket.id
        }
        log(message)
        io.emit('message', message)
    })
    socket.on('disconnect', () => log('user disconnect'))
})


export default server
