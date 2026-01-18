// src/modules/vehicle/vehicle.service.ts
import { pool } from "../../database/db";

interface VehiclePayload {
  vehicle_name: string;
  type: 'car' | 'bike' | 'van' | 'SUV';
  registration_number: string;
  daily_rent_price: number;
  availability_status: 'available' | 'booked';
}

interface UpdateVehiclePayload {
  vehicle_name?: string;
  type?: 'car' | 'bike' | 'van' | 'SUV';
  daily_rent_price?: number;
  availability_status?: 'available' | 'booked';
}

export const getAllVehiclesFromDB = async () => {
  const query = `
    SELECT 
      id,
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status
    FROM vehicles
    ORDER BY id ASC
  `;

  const { rows } = await pool.query(query);
  return rows;
};




export const createVehicleInDB = async (payload: VehiclePayload) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = payload;

  const query = `
    INSERT INTO vehicles (
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};




export const getVehicleByIdFromDB = async (vehicleId: number) => {
  const query = `
    SELECT 
      id,
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status
    FROM vehicles
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [vehicleId]);
  return rows[0];
};



export const updateVehicleInDB = async (
  vehicleId: number,
  payload: UpdateVehiclePayload
) => {
  const fields: string[] = [];
  const values: any[] = [];

  let index = 1;

  if (payload.vehicle_name) {
    fields.push(`vehicle_name = $${index++}`);
    values.push(payload.vehicle_name);
  }

  if (payload.type) {
    fields.push(`type = $${index++}`);
    values.push(payload.type);
  }

  if (payload.daily_rent_price !== undefined) {
    fields.push(`daily_rent_price = $${index++}`);
    values.push(payload.daily_rent_price);
  }

  if (payload.availability_status) {
    fields.push(`availability_status = $${index++}`);
    values.push(payload.availability_status);
  }

  if (!fields.length) {
    return null;
  }

  const query = `
    UPDATE vehicles
    SET ${fields.join(', ')}
    WHERE id = $${index}
    RETURNING *
  `;

  values.push(vehicleId);

  const { rows } = await pool.query(query, values);
  return rows[0];
};



export const deleteVehicleFromDB = async (vehicleId: number) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // vehicel???
    const vehicleRes = await client.query(
      `SELECT id FROM vehicles WHERE id = $1`,
      [vehicleId]
    );

    if (vehicleRes.rows.length === 0) {
      throw new Error("VEHICLE_NOT_FOUND");
    }

    // booking?
    const activeBookingRes = await client.query(
      `
      SELECT 1
      FROM bookings
      WHERE vehicle_id = $1
        AND status = 'active'
      LIMIT 1
      `,
      [vehicleId]
    );

    if (activeBookingRes.rows.length > 0) {
      throw new Error("VEHICLE_HAS_ACTIVE_BOOKINGS");
    }

    //detach the vehicle from a returned/cancelled vehicle for safe deletion without any foreign key issues 
    /*await client.query(
      `UPDATE bookings
       SET vehicle_id = NULL
       WHERE vehicle_id = $1
       AND status IN ('returned', 'cancelled')`,
      [vehicleId]
    );*/

    // Del-V
    await client.query(
      `DELETE FROM vehicles WHERE id = $1`,
      [vehicleId]
    );

    await client.query("COMMIT");

    return { message: "Vehicle deleted successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};