import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
    try {
        const {
            email,
            username,
            password,
            age,
            weight,
            height,
            goal,
        } = req.body;

        if (
            !email ||
            !username ||
            !password ||
            age === undefined ||
            weight === undefined ||
            height === undefined ||
            !goal
        ) {
            return res.status(400).json({
                error: 'All fields are required',
            });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                passwordHash: hashedPassword,
                age,
                weight,
                height,
                goal,
            },
            select: {
                id: true,
                email: true,
                username: true,
                age: true,
                weight: true,
                height: true,
                goal: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            message: 'User created successfully',
            user,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: 'Internal server error',
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required',
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: '7d',
            }
        );

        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: 'Internal server error',
        });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                id: true,
                email: true,
                username: true,
                age: true,
                weight: true,
                height: true,
                goal: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        return res.json(user);
    } catch (error) {
        return res.status(500).json({
            error: 'Internal server error',
        });
    }
};