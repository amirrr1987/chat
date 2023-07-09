import { log } from "console";
import express from "express";
import { connect } from "mongoose";
import { red, green, cyan } from 'colors'
import auth from './auth'
import chat from './chat'
import cors from 'cors';
const app = express()


export default class Application {
    port: number;
    database: string;
    constructor({ port, database }: { port: number, database: string }) {
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
            log(green(`database is connected`))
        }
        catch (error) {
            log(red(`${error}`))
        }
    }

    configModule() {
        app.use("/api/v1/auth", auth)
    }


    configServer() {
        app.listen(this.port, () => log(green(`server run on port ${this.port}`)))
        chat.listen(4000, () => console.log(cyan(`listening on ${4000}`)));
    }
}