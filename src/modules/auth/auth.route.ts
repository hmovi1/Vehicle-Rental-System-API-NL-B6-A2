import { Router } from "express"
import { authController } from "./auth.controller"
const route = Router()


route.post("/signUp", authController.signUp)
route.post("/signIn", authController.signIn)

export const authRoute = route
