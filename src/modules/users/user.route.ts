import { Router } from "express";
import { userController } from "./user.controller";
import { auth } from "../../middleware/auth-old";
import { Roles } from "../auth/auth.constant";
const route = Router();

//route.post("/api/v1/users", 

route.get("/", auth(Roles.admin), userController.getAllUser);
route.delete("/:userId",auth(Roles.admin),  userController.deleteUser);
route.put('/:userId', auth(Roles.admin , Roles.customer) , userController.updateUser);




export const userRoute = route