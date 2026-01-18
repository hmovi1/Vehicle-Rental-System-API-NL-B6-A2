
import { Request, Response } from 'express';
import * as vehicleService from './vehicle.service';
import { NextFunction } from 'express';

 export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.getAllVehiclesFromDB();

    res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: vehicles,
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicles',
    });
  }
};


 export const createVehicle = async (req: Request, res: Response) => {
  try {
    const {
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    } = req.body;

    if (
      !vehicle_name ||
      !type ||
      !registration_number ||
      !daily_rent_price ||
      !availability_status
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const vehicle = await vehicleService.createVehicleInDB({
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);

    // Unique constraint (registration_number)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this registration number already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add vehicle',
    });
  }
};

export  const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const id = Number(vehicleId);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    const vehicle = await vehicleService.getVehicleByIdFromDB(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle',
    });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const id = Number(vehicleId);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    const {
      vehicle_name,
      type,
      daily_rent_price,
      availability_status,
    } = req.body;

    if (
      vehicle_name === undefined &&
      type === undefined &&
      daily_rent_price === undefined &&
      availability_status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update',
      });
    }

      const updatedVehicle = await vehicleService.updateVehicleInDB(id, {
      vehicle_name,
      type,
      daily_rent_price,
      availability_status,
    });

    if (!updatedVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or no fields updated',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle,
    });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);

    // Postgres CHECK constraint violation
    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle data provided',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
    });
  }
};

export const deleteVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const vehicleId = Number(req.params.vehicleId);

    const result = await vehicleService.deleteVehicleFromDB(vehicleId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    if (error.message === "VEHICLE_NOT_FOUND") {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (error.message === "VEHICLE_HAS_ACTIVE_BOOKINGS") {
      return res.status(400).json({
        message: "Vehicle cannot be deleted while active bookings exist"
      });
    }

    next(error);
  }
};