
import type{Request,Response} from 'express'
const prisma=require('../prisma')
import type {User} from '@prisma/client'

interface myRequest extends Request{
    user:User
}

const createSession=async(req:myRequest,res:Response):Promise<Response|void>=>{
    try {
        const user=req.user;
        if (!user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
     const session=  await prisma.session.create({
        data:{
            adminId:user.id,
            users:{
                create:{userId:user.id}
            }
        }
    
       })
       return res.status(200).json({sessionId:session.id})
    } catch (error) {
        console.log("Error creating session", error);
        return res.status(500).json({ message: "error while generating sessionid" });
    }
     
}
const joinSession=async(req:myRequest,res:Response)=>{
            try {
                 const {sessionId}=req.body;
         const user=req.user;
         const session=await prisma.session.findUnique({where:{id:sessionId},include:{users:true}})
         if(!session){
            return res.status(404).json({ message: "session does not exist" });
         }
         const exist=session.users.some((u:{userId:string})=>u.userId===user.id)
         if(!exist){
            await prisma.sessionUsers.create({
                data:{
                    userId:user.id,sessionId
                }
            })
         }
         return res.status(200).json({
            message:'joined',
            userId:user.id,
            adminId:session.adminId,
            sessionId
        })
            } catch (error) {
                console.log('error while joining the session',error)
            }
        
}
const exitSession=async(req:myRequest,res:Response)=>{
         try {
            const {sessionId}  =req.body;
        const user=req.user;
        const session=await prisma.session.findUnique({where:{id:sessionId}})
        if(!session){
            return res.status(404).json({message:'session is not existent'})
        }
          if(session.adminId===user.id){
            
            await prisma.sessionUsers.deleteMany( {where:{sessionId}})
            await prisma.session.delete( {where:{id:sessionId}})
            return res.status(200).json({message:'session ended'})
        }
        await prisma.sessionUsers.deleteMany( {where:{userId:user.id,sessionId}})
        return res.status(200).json({message:'session exited'})
          
            
         } catch (error) {
            console.log('error while exiting or ending the session',error)
         }
        

}

const getUsers=async(req:myRequest,res:Response):Promise<Response|void>=>{
    try {
        const {sessionId}=req.body;
        const users=  await prisma.sessionUsers.findMany({where:{sessionId},include:{user:true}})


         return res.status(200).json({
          users: users.map((u: { userId: string; joinedAt:Date; user: { username: string; email: string } })=>({
          userId:u.userId,
          joinedAt:u.joinedAt,
          username:u.user.username,
          email:u.user.email
           }))
         })
    } catch (error) {
     console.log('error while getting users of the session',error)

    }

             
}
module.exports={createSession,joinSession,exitSession,getUsers};