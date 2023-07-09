import { pick } from "lodash"
import { Request, Response, NextFunction } from "express"
import model from './model'
import { compare, genSalt, hash } from "bcrypt"
import { Login } from "./dto"
export default new class Controller {
  async login(req: Request, res: Response, next: NextFunction) {
    const user: Login | null = await model.findOne({ mobile: req.body.mobile })

    if (!user) {
      return res.status(401).send({ message: 'mobile or password is not correct!' })
    }

    const comparePassword: boolean = await compare(req.body.password, user.password)
    if (!comparePassword) {
      return res.status(401).send({ message: 'mobile or password is not correct!' })
    }
    const id = pick(user, ['_id'])
    res.status(200).send({
      status: 200,
      data: id,
      message: 'login success',
      success: true
    })

  }
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      let user = await model.findOne({ mobile: req.body.mobile })
      if (!!user) {
        return res.status(401).send({ message: 'You are registered!' })
      }
      const salt: string = await genSalt(10)
      const hashPassword: string = await hash(req.body.password, salt)

      user = await model.create({ ...req.body, password: hashPassword })
      res.status(201).send(user)

    } catch (error: any) {
      res.status(500).send(error.message)

    }
  }
}