const router = require("express").Router()

const UserController = require("../controllers/user")

router.get("/",UserController.getOne)
router.post("/",UserController.postOne)
router.put("/",UserController.putOne)
router.delete("/",UserController.deleteOne)

module.exports = router
