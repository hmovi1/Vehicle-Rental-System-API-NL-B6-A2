
import { pool } from "../../database/db";

interface CreateBookingPayload {
  customer_id: number;
  vehicle_id: number;
  rent_start_date: string;
  rent_end_date: string;
}

type BookingStatus = 'active' | 'cancelled' | 'returned';

export const createBookingInDB = async (payload: CreateBookingPayload) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1 Lock vehicle row to prevent race conditions
    const vehicleQuery = `
      SELECT daily_rent_price, availability_status
      FROM vehicles
      WHERE id = $1
      FOR UPDATE
    `;
    const vehicleResult = await client.query(vehicleQuery, [
      payload.vehicle_id,
    ]);

    if (!vehicleResult.rows.length) {
      throw new Error('VEHICLE_NOT_FOUND');
    }

    const vehicle = vehicleResult.rows[0];

    if (vehicle.availability_status !== 'available') {
      throw new Error('VEHICLE_NOT_AVAILABLE');
    }

    // 2️ Calculate rental duration in days
    // Calculate rental days
    // Calculate rental days
const start = new Date(payload.rent_start_date);
const end = new Date(payload.rent_end_date);
const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

if (days <= 0) throw new Error('INVALID_DATE_RANGE');

const dailyPrice = Number(vehicle.daily_rent_price);
if (isNaN(dailyPrice)) throw new Error('INVALID_DAILY_PRICE');

const totalPrice = dailyPrice * days;

    // 3️ Insert booking
    const bookingQuery = `
      INSERT INTO bookings (
        customer_id,
        vehicle_id,
        rent_start_date,
        rent_end_date,
        total_price,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `;
    const bookingValues = [
      payload.customer_id,
      payload.vehicle_id,
      payload.rent_start_date,
      payload.rent_end_date,
      totalPrice,
    ];
    const bookingResult = await client.query(bookingQuery, bookingValues);

    // 4️ Update vehicle status to "booked"
    const updateVehicleQuery = `
      UPDATE vehicles
      SET availability_status = 'booked'
      WHERE id = $1
    `;
    await client.query(updateVehicleQuery, [payload.vehicle_id]);

    await client.query('COMMIT');

    return bookingResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getBookingsFromDB = async (user: {
  id: number;
  role: 'admin' | 'customer';
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️ Auto-return logic: mark past bookings as returned
    const today = new Date().toISOString().split('T')[0];

    const autoReturnQuery = `
      UPDATE bookings b
      SET status = 'returned'
      FROM vehicles v
      WHERE b.vehicle_id = v.id
        AND b.status = 'active'
        AND b.rent_end_date < $1
      RETURNING b.id, b.vehicle_id
    `;

    const autoReturnedBookings = await client.query(autoReturnQuery, [
      today,
    ]);

    // 2 Update vehicle availability for returned bookings
    if (autoReturnedBookings.rows.length > 0) {
      const vehicleIds = autoReturnedBookings.rows.map((r) => r.vehicle_id);
      const updateVehiclesQuery = `
        UPDATE vehicles
        SET availability_status = 'available'
        WHERE id = ANY($1::int[])
      `;
      await client.query(updateVehiclesQuery, [vehicleIds]);
    }

    // 3️ Fetch bookings
    let bookingsQuery = `
      SELECT 
        b.id,
        b.customer_id,
        b.vehicle_id,
        b.rent_start_date,
        b.rent_end_date,
        b.total_price,
        b.status,
        u.name AS customer_name,
        u.email AS customer_email,
        v.vehicle_name,
        v.type AS vehicle_type,
        v.registration_number,
        v.daily_rent_price
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
    `;

    const values: any[] = [];

    if (user.role === 'customer') {
      bookingsQuery += ` WHERE b.customer_id = $1`;
      values.push(user.id);
    }

    bookingsQuery += ` ORDER BY b.rent_start_date DESC`;

    const { rows } = await client.query(bookingsQuery, values);

    await client.query('COMMIT');
    return rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};



/*export const updateBookingStatusInDB = async (
  bookingId: number,
  requestStatus:'active' | 'cancelled' | 'returned',
  userRole: 'admin' | 'customer',
  userId: number
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock booking row
    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id=$1 FOR UPDATE`,
      [bookingId]
    );

    if (!bookingRes.rows.length) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    const booking = bookingRes.rows[0];

    // Lock vehicle row
    const vehicleRes = await client.query(
      `SELECT * FROM vehicles WHERE id=$1 FOR UPDATE`,
      [booking.vehicle_id]
    );

    const vehicle = vehicleRes.rows[0];

    const today = new Date();
    const rentStartDate = new Date(booking.rent_start_date);
    const rentEndDate = new Date(booking.rent_end_date);

    let newStatus: BookingStatus | null = null;

    if (userRole === 'customer') {
      // Customers can cancel only before start date
      if (booking.customer_id !== userId) {
        throw new Error('NOT_AUTHORIZED');
      }
      if (today >= rentStartDate) {
        throw new Error('CANNOT_CANCEL_AFTER_START');
      }
      newStatus = 'cancelled';
    } else if (userRole === 'admin') {
      // Admin can mark returned
      if (booking.status !== 'active') {
        throw new Error('ONLY_ACTIVE_CAN_BE_RETURNED');
      }
      newStatus = 'returned';
    }

    // System auto-return logic
    if (booking.status === 'active' && today > rentEndDate) {
      newStatus = 'returned';
    }

    // If status changes
    if (newStatus) {
      const updateBookingQuery = `
        UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *
      `;
      const updatedBooking = await client.query(updateBookingQuery, [
        newStatus,
        bookingId,
      ]);

      // Update vehicle availability if booking is cancelled or returned
      if (['cancelled', 'returned'].includes(newStatus)) {
        await client.query(
          `UPDATE vehicles SET availability_status='available' WHERE id=$1`,
          [booking.vehicle_id]
        );
      }

      await client.query('COMMIT');
      return updatedBooking.rows[0];
    } else {
      await client.query('COMMIT');
      return booking; // no changes
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}; */

export const updateBookingStatusInDB = async (
  bookingId: number,
  requestStatus: 'active' | 'cancelled' | 'returned',
  userRole: 'admin' | 'customer',
  userId: number
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock booking
    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id=$1 FOR UPDATE`,
      [bookingId]
    );

    if (!bookingRes.rows.length) throw new Error('BOOKING_NOT_FOUND');
    const booking = bookingRes.rows[0];

    // Lock vehicle
    const vehicleRes = await client.query(
      `SELECT * FROM vehicles WHERE id=$1 FOR UPDATE`,
      [booking.vehicle_id]
    );
    const vehicle = vehicleRes.rows[0];

    const today = new Date();
    const rentStartDate = new Date(booking.rent_start_date);
    const rentEndDate = new Date(booking.rent_end_date);

    let newStatus: 'active' | 'cancelled' | 'returned' = booking.status;

    // ---------- CUSTOMER ----------
    if (userRole === 'customer') {
      if (booking.customer_id !== userId) throw new Error('NOT_AUTHORIZED');

      if (requestStatus === 'cancelled') {
        if (today >= rentStartDate) throw new Error('CANNOT_CANCEL_AFTER_START');
        newStatus = 'cancelled';
      } else if (requestStatus === 'active') {
        newStatus = booking.status;
      } else {
        throw new Error('NOT_AUTHORIZED');
      }
    }

    // ---------- ADMIN ----------
    if (userRole === 'admin') {
      if (requestStatus === 'returned') {
        if (booking.status !== 'active') throw new Error('ONLY_ACTIVE_CAN_BE_RETURNED');
        newStatus = 'returned';
      } else {
        newStatus = requestStatus;
      }
    }

    // ---------- SYSTEM AUTO-RETURN ----------
    if (booking.status === 'active' && today > rentEndDate) {
      newStatus = 'returned';
    }

    // ---------- UPDATE ----------
    if (newStatus !== booking.status) {
      const updatedBookingRes = await client.query(
        `UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *`,
        [newStatus, bookingId]
      );

      if (['cancelled', 'returned'].includes(newStatus)) {
        await client.query(
          `UPDATE vehicles SET availability_status='available' WHERE id=$1`,
          [booking.vehicle_id]
        );
      }

      await client.query('COMMIT');
      return updatedBookingRes.rows[0];
    }

    await client.query('COMMIT');
    return booking;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};



