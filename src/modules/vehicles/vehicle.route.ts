// src/modules/vehicle/vehicle.route.ts
import { Router } from 'express';
import * as vehicleController from "./vehicle.controller";
import { auth } from '../../middleware/auth-old';
import { Roles } from '../auth/auth.constant';

const router = Router();

router.get('/', auth(Roles.admin, Roles.customer) , vehicleController.getAllVehicles);
router.post('/', auth(Roles.admin) , vehicleController.createVehicle);
router.get('/:vehicleId', auth(Roles.admin, Roles.customer),vehicleController.getVehicleById);
router.put('/:vehicleId',  auth(Roles.admin), vehicleController.updateVehicle);
router.delete("/:vehicleId", auth(Roles.admin), vehicleController.deleteVehicle);

export const vehicleRoutes = router;
