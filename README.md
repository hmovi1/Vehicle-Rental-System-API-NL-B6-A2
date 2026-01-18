# Vehicle Rental System

**Live URL:** [https://vehicle-rental-system-beta-ten.vercel.app](https://vehicle-rental-system-beta-ten.vercel.app)

---

## Project Overview

A backend API for a **Vehicle Rental Management System** that handles:

- **Vehicles** – Manage vehicle inventory with availability tracking  
- **Customers** – Manage customer accounts and profiles  
- **Bookings** – Handle vehicle rentals, returns, and cost calculation  
- **Authentication** – Secure role-based access control (Admin and Customer roles)  

---

## Features

- Role-based access control:  
  - **Admin**: Full system access to manage vehicles, users, and bookings  
  - **Customer**: Can register, view vehicles, and manage own bookings  
- Secure authentication using JWT and bcrypt password hashing  
- Booking management:  
  - Active, cancelled, returned status  
  - Auto-return system for expired bookings  
  - Vehicle availability updates on booking status changes  
- Modular architecture with separation of concerns:  
  - Organized by features (`auth`, `users`, `vehicles`, `bookings`)  
  - Routes, controllers, and services layered for maintainability  
- API ready for Postman or frontend integration  

---

## Technology Stack

| Layer         | Technology |
|---------------|------------|
| Backend       | Node.js + TypeScript, Express.js |
| Database      | PostgreSQL |
| Authentication| bcrypt, JSON Web Token (JWT) |
| Deployment    | Vercel |
| Environment   | dotenv |

---

## Code Structure

src/
│
├─ controllers/ # Business logic for each module
├─ services/ # DB operations and service logic
├─ routes/ # Route definitions per module
├─ middlewares/ # Auth, error handling
├─ db.ts # Database connection (PostgreSQL)
├─ server.ts # Express server entry point
└─ config.ts # dotenv and environment setup


---

## Database Tables

### Users

| Field    | Notes |
|----------|-------|
| id       | Auto-generated |
| name     | Required |
| email    | Required, unique, lowercase |
| password | Required, min 6 characters |
| phone    | Required |
| role     | 'admin' or 'customer' |

### Vehicles

| Field               | Notes |
|--------------------|-------|
| id                  | Auto-generated |
| vehicle_name        | Required |
| type                | 'car', 'bike', 'van', or 'SUV' |
| registration_number | Required, unique |
| daily_rent_price    | Required, positive |
| availability_status | 'available' or 'booked' |

### Bookings

| Field           | Notes |
|-----------------|-------|
| id              | Auto-generated |
| customer_id     | Links to Users table |
| vehicle_id      | Links to Vehicles table |
| rent_start_date | Required |
| rent_end_date   | Required, must be after start date |
| total_price     | Required, positive |
| status          | 'active', 'cancelled', or 'returned' |

---

## Authentication & Authorization

- **User Roles**: Admin and Customer  
- **Password Handling**: bcrypt hashed before storage  
- **JWT Authentication**:
  - Sign-in endpoint returns a token
  - Token required in `Authorization: Bearer <token>` header
  - Unauthorized requests return 401 or 403  

---

## API Endpoints

### Auth

| Method | Endpoint               | Access | Description |
|--------|-----------------------|--------|-------------|
| POST   | /api/v1/auth/signup   | Public | Register new user |
| POST   | /api/v1/auth/signin   | Public | Login and receive JWT |

### Vehicles

| Method | Endpoint                     | Access     | Description |
|--------|------------------------------|------------|-------------|
| POST   | /api/v1/vehicles             | Admin only | Add new vehicle |
| GET    | /api/v1/vehicles             | Public     | View all vehicles |
| GET    | /api/v1/vehicles/:vehicleId  | Public     | View specific vehicle |
| PUT    | /api/v1/vehicles/:vehicleId  | Admin only | Update vehicle details |
| DELETE | /api/v1/vehicles/:vehicleId  | Admin only | Delete vehicle (no active bookings) |

### Users

| Method | Endpoint                 | Access       | Description |
|--------|--------------------------|--------------|-------------|
| GET    | /api/v1/users            | Admin only   | View all users |
| PUT    | /api/v1/users/:userId    | Admin/Own    | Update user role or own profile |
| DELETE | /api/v1/users/:userId    | Admin only   | Delete user (no active bookings) |

### Bookings

| Method | Endpoint                     | Access       | Description |
|--------|------------------------------|--------------|-------------|
| POST   | /api/v1/bookings             | Customer/Admin | Create booking, validate availability, calculate price |
| GET    | /api/v1/bookings             | Role-based    | Admin: all bookings; Customer: own bookings |
| PUT    | /api/v1/bookings/:bookingId  | Role-based    | Customer: cancel before start; Admin: mark returned; Auto-return system |

---


## Setup & Usage Instructions

Clone the repository using `git clone <repository-url>` and 

navigate into the project folder with `cd Vehicle-Rental-System`. 

Install dependencies by running `npm install`. 

Create a `.env` file in the project root with your database and server configuration: 
`DB_HOST=your_database_host`, 
`DB_USER=your_database_user`, 
`DB_PASSWORD=your_database_password`, 
`DB_NAME=your_database_name`, 
`DB_PORT=5432`, `PORT=3000`. 
Build the project using `npm run build` 
start the server with `npm start`. 

Test API endpoints using Postman or any API client; 
for example, update a booking status via 
`PATCH /api/v1/bookings/1/status` with the JSON body `{ "status": "cancelled" }`. 

To deploy to Vercel, run `vercel --prod` and ensure that environment variables are configured in the Vercel dashboard.
Make sure your PostgreSQL database is accessible remotely using a cloud service like Supabase, Heroku, or AWS RDS.


## AI Transparency

This project was debugged using AI at critical conflict points to deliver flawless consistency
and DB consistencies.

Claude Code - Sonnet 4.5
ChatGPT - GPT 5.2

**Some logics were further refined**

*Critical Vercel Deployment issues needed AI assisted edit in app.ts auth-old.ts*
*db.ts and server.ts minor readjustments*

*config tsconfig package files were adjusted accordingly.*
