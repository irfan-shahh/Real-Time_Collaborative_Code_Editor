const jwt=require('jsonwebtoken')
const prisma=require('../prisma')
require('dotenv').config()
import type {Request,Response,NextFunction} from 'express'
import type { User  } from '@prisma/client';



interface jwtPayload {
  userId: string;
  email: string;
}
interface authenticateRequest extends Request{
    user?:User
}

const authenticate=async(req:authenticateRequest,res:Response,next:NextFunction):Promise<Response|void>=>{
    try{

        const token=req.cookies.token;
        if(!token){
             return res.status(401).json({ msg: 'Access denied. No token provided.' });
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY as string)  as jwtPayload
        const userData=await prisma.user.findUnique({where: {id:decoded.userId}} )
        if (!userData) {
            return res.status(401).json({ msg: 'Invalid token. User not found.' });
        }
        req.user=userData
        next()
    }
    catch(error){

        return res.status(401).json({ msg: 'Invalid token.' });
    }
}
module.exports=authenticate