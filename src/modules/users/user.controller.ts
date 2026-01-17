import { Request, Response } from "express";
import { pool } from "../../database/db";
import { userServices } from "./user.service.js";

import { Roles } from "../auth/auth.constant.js";
import { error } from "node:console";


const getAllUser = async (req: Request, res: Response)=>{
    try {
    const result = await userServices.getAllUserIntoDB();
    return res.status(201).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.rows
    });
  } catch (error: any) {
    return res.status(500).json({
      success: true,
      message: error.message,
      data: error.data
    });
  }
};


const deleteUser = async (req: Request, res: Response) => {
  try {
    const loggedInUser = req.user as { id: number; role: 'admin' | 'customer' };
    const { userId } = req.params;
    const id = Number(userId);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    if (loggedInUser.role !== Roles.admin) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete users',
      });
    }

    const deletedUser = await userServices.deleteUserInDB(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error: any) {
    console.error('Delete user error:', error);

    if (error.message === 'USER_HAS_ACTIVE_BOOKINGS') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active bookings',
      });
    }

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};


  const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const targetUserId = Number(userId);

    if (isNaN(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const loggedInUser = req.user as {
      id: number;
      role: 'admin' | 'customer';
    };

    //can update only own profile
    if (
      loggedInUser.role === 'customer' &&
      loggedInUser.id !== targetUserId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this user',
      });
    }

    const { name, email, password, phone, role } = req.body;

    // can't change role
    if (loggedInUser.role === 'customer' && role) {
      return res.status(403).json({
        success: false,
        message: 'Customers cannot change role',
      });
    }

    const updatedUser = await userServices.updateUserInDB(targetUserId, {
      name,
      email,
      password,
      phone,
      role: loggedInUser.role === 'admin' ? role : undefined,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no fields updated',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);

    // Unique-email!
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
};

export const userController = {
    getAllUser,
    deleteUser, updateUser
}