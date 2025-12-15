const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')
require('dotenv').config()

import type { Request, Response } from 'express';

interface jwtPayload {
  userId: string;
  email: string;
}

const registerUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { username, email, password } = req.body;
        const emailRegex=/^[^\s@]+@[^\s@]+.[^\@]+$/
        if (!emailRegex.test(email))
            return res.status(400).json({ message: "Invalid email format." });
        const exist = await prisma.user.findUnique({ where: { email } })
        const existu = await prisma.user.findUnique({ where: { username } })
        if (exist) {
            return res.status(401).json({ message: 'the user already exists'})
        }
        if (existu) {
            return res.status(401).json({ message: 'username already exists'})
        }
        const hashedPassword: string =  await bcrypt.hash(password, 10)
        const newData = { ...req.body, password: hashedPassword }
        const newUser = await prisma.user.create({ data: newData })
        return res.status(200).json({ msg: 'new user created', newUser });
    } catch (error) {
        console.log('error while creating a new user', error);
        return res.status(500).json({ msg: 'Internal server error' });
    }

}

const loginUser = async (req:Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
        return res.status(400).json({ message: "Email and password required." });
        const exist = await prisma.user.findUnique({ where: { email: req.body.email } })
        if (!exist) {
            return res.status(404).json({ message: 'user does not exist' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email))
            return res.status(400).json({ message: "Invalid email format." });

        const isPasswordValid: boolean = await bcrypt.compare(req.body.password, exist.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'invalid password' });
        }
        const token = jwt.sign({ userId: exist.id, email: exist.email }, process.env.JWT_SECRET_KEY as string, { expiresIn: '7d' })
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({
            msg: 'Login successful',
            user: {
                username: exist.username,
                email: exist.email,
                id:exist.id
            }
        })

    } catch (error) {
        console.log('error while logging in', error);
        return res.status(500).json({ msg: 'Internal server error' });
    }
}

const logoutUser=(req:Request,res:Response):Response=>{
  res.clearCookie('token',{
    httpOnly:true
  })
  return res.status(200).json({msg:'Logout successfully'})
}

const verifyUser= async (req:Request,res:Response):Promise<Response>=>{
    try {
        const token=req.cookies.token;
        if (!token) {
      return res.status(401).json({ msg: 'no token provided' });
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY as string) as  jwtPayload
    const userData = await prisma.user.findUnique({
     where: { id: decoded.userId }
    })
       
    return res.status(200).json({
      user: {
        username: userData.username,
        email: userData.email, 
        id: userData.id,
        profilePic:userData.profilePic
      }
      })

    } catch (error) {
        console.log('error while verifying user', error);
        return res.status(401).json({ msg: 'Invalid token' });
    }
}

module.exports = { loginUser, registerUser ,logoutUser,verifyUser}
