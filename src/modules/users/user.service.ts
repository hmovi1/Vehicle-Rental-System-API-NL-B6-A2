import { pool } from "../../database/db";
import bcrypt from "bcryptjs";


interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: 'admin' | 'customer';
}


const getAllUserIntoDB = async () => {
  const result = await pool.query(
    `
    SELECT * FROM users
    `
 );
 return result;
};


export const deleteUserInDB = async (userId: number) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check for active bookings
    const activeBookingCheck = await client.query(
      `SELECT 1 FROM bookings WHERE customer_id = $1 AND status = 'active'`,
      [userId]
    );

    if (activeBookingCheck.rows.length > 0) {
      throw new Error('USER_HAS_ACTIVE_BOOKINGS');
    }

    // Delete user
    const deleteQuery = `DELETE FROM users WHERE id = $1 RETURNING id, name, email`;
    const result = await client.query(deleteQuery, [userId]);

    if (!result.rows.length) {
      throw new Error('USER_NOT_FOUND');
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};




const updateUserInDB = async (
  userId: number,
  payload: UpdateUserPayload
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (payload.name) {
    fields.push(`name = $${index++}`);
    values.push(payload.name);
  }

  if (payload.email) {
    fields.push(`email = $${index++}`);
    values.push(payload.email);
  }
   
  // Hash password if provided
    if (payload.password) {
      const hashed = await bcrypt.hash(payload.password, 10);
      fields.push(`password=$${index++}`);
      values.push(hashed);
    }

  if (payload.phone) {
    fields.push(`phone = $${index++}`);
    values.push(payload.phone);
  }

  if (payload.role) {
    fields.push(`role = $${index++}`);
    values.push(payload.role);
  }

  if (!fields.length) {
    return null;
  }

  const query = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = $${index}
    RETURNING id, name, email, phone, role
  `;

  values.push(userId);

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const userServices = {
    getAllUserIntoDB,
    deleteUserInDB, updateUserInDB
}

