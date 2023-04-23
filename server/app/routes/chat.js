const router = require("express").Router()

const ChatController = require("../controllers/chat")


router.get("/:chatId", ChatController.getOne)
router.post("/", ChatController.postOne)
router.put("/", ChatController.putOne)
router.delete("/", ChatController.deleteOne)

module.exports = router
