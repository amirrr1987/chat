const express = require("express")
const routes = require("./routes")
const { default: mongoose } = require("mongoose")
const cors = require("cors")
const app = express()

class Application {
    constructor({ appName, port }) {
        this.appName = appName
        this.port = port
        this.setupMiddleware()
        this.setupDatabase()
        this.setupServer()
        this.setupRoutes()
    }
    setupMiddleware() {
        app.use(cors())
        app.use(express.json())
        app.use(function (err, req, res, next) {
            if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
                return res
                    .status(500)
                    .send({
                        code: 500,
                        message: "JSON parse error",
                        success: false,
                    })
            }
            next(err)
        });
    }
    async setupDatabase(){
        await mongoose.connect("mongodb://127.0.0.1:27017/chat").then(()=>{
            console.log("db connected");
        })
        .catch(()=>{
            console.log("db not connected");
        })
    }
    setupConfig() { }
    setupRoutes() {
        app.use("/api", routes)
    }
    setupServer() {
        app.listen(this.port, () => {
            console.log(`${this.appName} run on port ${this.port}`)
        })
    }
}

module.exports = Application