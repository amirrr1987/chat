const router = require("express").Router()

const userRoutes = require("./user")
const chatRoutes = require("./chat")

router.use("/users", userRoutes)
router.use("/chats",chatRoutes)


module.exports = router