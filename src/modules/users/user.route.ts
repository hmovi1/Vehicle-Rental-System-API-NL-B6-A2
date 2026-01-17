import { Router } from "express";
import { userController } from "./user.controller.js";
import { auth } from "../../middleware/auth-old.js";
import { Roles } from "../auth/auth.constant.js";
const route = Router();

//route.post("/api/v1/users", 

route.get("/", auth(Roles.admin), userController.getAllUser);
route.delete("/:userId",auth(Roles.admin), userController.deleteUser);
route.put('/:userId', auth(Roles.admin , Roles.customer) , userController.updateUser);




export const userRoute = route