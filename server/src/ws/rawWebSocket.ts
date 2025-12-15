const {WebSocketServer,WebSocket}= require('ws')
import type  {WebSocket as wstype } from 'ws';
const {v4 : uuidv4}=require('uuid')

interface WS extends wstype{
     clientId?:string,
     sessionId?:string,
     user?:{
        id:string,
        username:string,
        joinedAt:number
     }
}

function initRawWs(wssRaw:WS){

    const rooms=new Map<string,Set<WS>>()
    
    function broadCast(sessionId:string,data:object){
        const clients=rooms.get(sessionId);
        if(!clients) return;
        for(const ws of clients){
           if(ws.readyState===WebSocket.OPEN){
            ws.send(JSON.stringify(data))
           }
        }
    }
      
    
    wssRaw.on("connection",(ws:WS)=>{
    ws.clientId=uuidv4()
    
    ws.on('message',(raw)=>{
        let msg=JSON.parse(raw.toString());
        if(msg.type==='join'){
            ws.sessionId=msg.sessionId;
            ws.clientId=msg.clientId;
           
            if(!rooms.has(msg.sessionId)){
                rooms.set(msg.sessionId,new Set())
            }
            
            ws.user={
                id:msg.user.id,
                username:msg.user.username,
                joinedAt:msg.user.joinedAt
            }
            rooms.get(msg.sessionId)?.add(ws);
            ws.send(JSON.stringify({type:'sessionValid'}))
            broadCast(ws.sessionId!,{
                type:'usersList',
                users:Array.from(rooms.get(ws.sessionId!)??[]).map((c)=>({
                    id:c.user?.id,
                    username:c.user?.username,
                    joinedAt:c.user?.joinedAt
                }))
            })

        }
        if(msg.type==='verifySession'){
            if(rooms.has(msg.sessionId)){
                ws.send(JSON.stringify({type:'sessionValid'}))
            }else{
                ws.send(JSON.stringify({type:'sessionInvalid'}))
                
            }
        }
        if (msg.type === "kickUser") {
       const { sessionId, targetUserId } = msg;
         const set = rooms.get(sessionId);
       if (!set) return;

  for (const client of set) {
    if (client.user?.id === targetUserId) {
      client.send(JSON.stringify({ type: "kicked" }));

      client.close();
      set.delete(client);

      break;
    }
  }
  broadCast(sessionId, {
    type: "usersList",
    users: Array.from(set).map(c => ({
      id: c.user?.id,
      username: c.user?.username,
      joinedAt: c.user?.joinedAt
    }))
  });
}


     if(msg.type==='leave'){
        const set=  rooms.get(ws.sessionId!)
           if(!set) return;
           if(msg.isAdmin===true){
            broadCast(ws.sessionId!,{
              type:'sessionEnded'
            })
            for (const client of set){
              client.close()
            }
            rooms.delete(ws.sessionId!)
            return
           }
        set?.delete(ws);
        broadCast(ws.sessionId!,{
            type:'usersList',
            users:Array.from(set || []).map((c)=>({
                    id:c.user?.id,
                    username:c.user?.username,
                    joinedAt:c.user?.joinedAt
            }))
        })
     }
    })
    ws.on('close',()=>{
        const set=rooms.get(ws.sessionId!)
        if(set){
            set.delete(ws)
            broadCast(ws.sessionId!,{
            type:'usersList',
            users:Array.from(set || []).map((c)=>({
                    id:c.user?.id,
                    username:c.user?.username,
                    joinedAt:c.user?.joinedAt
            }))
        })
        }
    })
  
})
}
module.exports=initRawWs;