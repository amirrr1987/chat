import { Router } from 'express'
import validator from "./validator"
import controller from "./controller"
const router = Router()

router.post('/login', validator.login, controller.login)

router.post('/register', validator.register, controller.register)

export default router