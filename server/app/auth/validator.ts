import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./dto";

export default new class Validator {
  async login(req: Request, res: Response, next: NextFunction) {
    const { success, error }: any = await loginSchema.safeParseAsync(req.body)
    if (!success) {
      return res.status(400).send(error.issues)
    }
    next()
  }
  async register(req: Request, res: Response, next: NextFunction) {
    const { success, error }: any = await registerSchema.safeParseAsync(req.body)
    if (!success) {
      return res.status(400).send(error.issues)
    }
    next()
  }
}