import { pool } from "../../database/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";





interface SignUpUserInput{
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
}

const signUpUserIntoDB = async ({name, email, password, phone, role} : SignUpUserInput) => {

    const hashPassword = await bcrypt.hash(password as string,12);
    const result = await pool.query(`
        INSERT INTO users(name, email, password, phone, role) VALUES($1, $2, $3, $4, $5) RETURNING *
        `,[name, email, hashPassword, phone, role]
    );
    delete result.rows[0].password
 return result;
};

const signInUserFromDB = async (email: string, password: string) => {
  const user = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email]
  );
  if (user.rows.length === 0) {
    throw new Error("User not found!");
  }
  const matchPassowrd = await bcrypt.compare(password, user.rows[0].password);

  if (!matchPassowrd) {
    throw new Error("Invalid Credentials!");
  }
  const jwtPayload = {
    id: user.rows[0].id,
    name: user.rows[0].name,
    email: user.rows[0].email,
    role : user.rows[0].role,
  };

   
   

   const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET is not configured");
}
const token = jwt.sign(jwtPayload, secret, { expiresIn: "7d" });

  return { token, user: user.rows[0] };
};


export const authServices = {signUpUserIntoDB , signInUserFromDB }