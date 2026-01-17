// src/modules/booking/booking.route.ts
import { Router } from 'express';
import { createBooking, getBookings, updateBookingStatus } from './booking.controller.js';
import { auth } from '../../middleware/auth-old.js';
import { Roles } from '../auth/auth.constant.js';
const router = Router();

router.post('/', auth(Roles.admin, Roles.customer),createBooking );

router.get('/', auth(Roles.admin, Roles.customer),getBookings);

router.put('/:bookingId', auth(Roles.admin, Roles.customer), updateBookingStatus);


export const bookingRoutes = router;
