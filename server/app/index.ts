import { log } from "console";
import express from "express";
import { connect } from "mongoose";
import { red, green, cyan, yellow, bgGreen, bgCyan, bgRed } from 'colors'
import auth from './auth'
import chat from './chat'
import cors from 'cors';
const app = express()

interface Port {
    app: number,
    chat: number
}

export default class Application {
    port: Port;
    database: string;
    constructor({ port, database }: { port: Port, database: string }) {
        this.port = port
        this.database = database
        this.configBeforeMiddleware()
        this.configDatabase()
        this.configModule()
        this.configServer()
    }

    configBeforeMiddleware() {
        app.use(cors())
        app.use(express.json())
    }

    async configDatabase() {
        try {
            await connect(this.database)
            log(bgRed(`database is connected`))
        }
        catch (error) {
            log(red(`${error}`))
        }
    }

    configModule() {
        app.use("/api/v1/auth", auth)
    }


    configServer() {
        app.listen(this.port.app, () => log(bgGreen(`server run on port ${this.port.app}`)))
        chat.listen(this.port.chat, () => console.log(bgCyan(`chat run on port ${this.port.chat}`)));
    }
}