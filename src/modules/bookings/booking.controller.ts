
import { Request, Response } from 'express';
import { createBookingInDB, getBookingsFromDB, updateBookingStatusInDB } from './booking.service';
import { Roles } from '../auth/auth.constant';
import { pool } from '../../database/db';

export const createBooking = async (req: Request, res: Response) => {
  try {
    const loggedInUser = req.user as {
      id: number;
      role: 'admin' | 'customer';
    };

    const { customer_id, vehicle_id, rent_start_date, rent_end_date } =
      req.body;

    if (!vehicle_id || !rent_start_date || !rent_end_date) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id, rent_start_date, and rent_end_date are required',
      });
    }

    // Cus can only create booking for himself
    const finalCustomerId =
      loggedInUser.role === Roles.admin
        ? customer_id || loggedInUser.id
        : loggedInUser.id;

    if (loggedInUser.role === Roles.customer && customer_id && customer_id !== loggedInUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Customers can only create bookings for themselves',
      });
    }

    const booking = await createBookingInDB({
      customer_id: finalCustomerId,
      vehicle_id,
      rent_start_date,
      rent_end_date,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Booking creation error:', error);

    if (error.message === 'VEHICLE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    if (error.message === 'VEHICLE_NOT_AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for booking',
      });
    }

    if (error.message === 'INVALID_DATE_RANGE') {
      return res.status(400).json({
        success: false,
        message: 'rent_end_date must be after rent_start_date',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
    });
  }
};

export const getBookings = async (req: Request, res: Response) => {
  try {
    const loggedInUser = req.user as {
      id: number;
      role: 'admin' | 'customer';
    };

    const bookings = await getBookingsFromDB(loggedInUser);

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
    });
  }
};


export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const loggedInUser = req.user as { id: number; role: 'admin' | 'customer' };
    const bookingId = Number(req.params.bookingId);

    // body parsing safety
    let requestBody: any = req.body;

    // If body is a string (raw), try parsing
    if (typeof requestBody === 'string') {
      try {
        requestBody = JSON.parse(requestBody);
      } catch {
        requestBody = {};
      }
    }

    const requestStatus = requestBody?.status as 'active' | 'cancelled' | 'returned';

    // Validate
    if (isNaN(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    if (!requestStatus || !['active', 'cancelled', 'returned'].includes(requestStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing status in request body' });
    }

    // Update booking
    const updatedBooking = await updateBookingStatusInDB(
      bookingId,
      requestStatus,
      loggedInUser.role,
      loggedInUser.id
    );

    // Fetch vehicle info if needed
    let vehicleData = null;
    if (['returned', 'cancelled'].includes(updatedBooking.status)) {
      const vehicleRes = await pool.query(
        `SELECT id, availability_status FROM vehicles WHERE id=$1`,
        [updatedBooking.vehicle_id]
      );
      vehicleData = vehicleRes.rows[0] || null;
    }

    // respond
    if (updatedBooking.status === 'cancelled') {
      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: {
          ...updatedBooking,
          ...(vehicleData ? { vehicle: vehicleData } : {}),
        },
      });
    }

    if (updatedBooking.status === 'returned') {
      return res.status(200).json({
        success: true,
        message: 'Booking marked as returned. Vehicle is now available',
        data: {
          ...updatedBooking,
          vehicle: vehicleData,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Booking status updated to ${updatedBooking.status}`,
      data: updatedBooking,
    });

  } catch (error: any) {
    console.error('Update booking status error:', error);

    if (error.message === 'BOOKING_NOT_FOUND') return res.status(404).json({ success: false, message: 'Booking not found' });
    if (error.message === 'CANNOT_CANCEL_AFTER_START') return res.status(400).json({ success: false, message: 'Cannot cancel booking after start date' });
    if (error.message === 'NOT_AUTHORIZED') return res.status(403).json({ success: false, message: 'Not authorized' });
    if (error.message === 'ONLY_ACTIVE_CAN_BE_RETURNED') return res.status(400).json({ success: false, message: 'Only active bookings can be marked as returned' });

    return res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
};




