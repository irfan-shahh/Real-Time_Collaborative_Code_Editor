const {WebSocketServer,WebSocket}= require('ws')
import type  {WebSocket as wstype } from 'ws';
const {v4 : uuidv4}=require('uuid')
import Y = require("yjs");
const syncProtocol = require("y-protocols/sync");
const awareness=require("y-protocols/awareness")
const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");
import type{ IncomingMessage} from 'http'
interface WS extends wstype{
     clientId?:string,
     sessionId?:string,
     user?:{
        id:string,
        username:string,
        joinedAt:number
     }
}

function initYjsWS(wssYjs:wstype){
const docs= new Map<string,Y.Doc>()
const docClients=new Map<string,Set<wstype>>();
const docAwareness=new Map<string,any>();

function getYdoc(docname:string):Y.Doc{
   let doc=docs.get(docname);
   if(!doc){
     doc=new Y.Doc()
    docs.set(docname,doc);
    docClients.set(docname,new Set())
    const awarenessState = new awareness.Awareness(doc);
    docAwareness.set(docname, awarenessState);
   }
   return doc;
}

    wssYjs.on('connection',(ws:wstype,req:IncomingMessage)=>{
     console.log(' YJS CONNECTION EVENT FIRED');    
    const url=req.url || '/';
    console.log('YJS raw URL:', url);
  
    let docname = 'default';
    if (url.startsWith('/yjs-ws/')) {
      const parts = url.split('?');
      const pathPart = parts[0] || url; 
      docname = pathPart.replace('/yjs-ws/', '') || 'default';
    } else if (url === '/yjs-ws') {
      docname = 'default';
    }
    console.log('YJS docname:', docname);
    const doc=getYdoc(docname)
    const awarenessState = docAwareness.get(docname)!;
    const clients = docClients.get(docname);
  if (clients) {
    clients.add(ws);
  }
    ws.binaryType='arraybuffer';
    
   
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); 
    
    ws.on('pong', () => {
      
    });



   try {
     const enc=encoding.createEncoder()
     encoding.writeVarUint(enc,0)
     syncProtocol.writeSyncStep1(enc,doc)
     const syncMessage = encoding.toUint8Array(enc);
     if (syncMessage.length > 0 && ws.readyState === WebSocket.OPEN) {
       ws.send(syncMessage);
     }
   } catch (error) {
     console.error('Error sending sync step 1:', error);
   }
   
 
   try {
     const enc2=encoding.createEncoder()
     encoding.writeVarUint(enc2, 1);
     const states = Array.from(awarenessState.getStates().keys());
     const update = awareness.encodeAwarenessUpdate(awarenessState, states);
     encoding.writeVarUint8Array(enc2, update);
     const awarenessMessage = encoding.toUint8Array(enc2);
     if (awarenessMessage.length > 0 && ws.readyState === WebSocket.OPEN) {
       ws.send(awarenessMessage);
     }
   } catch (error) {
     console.error('Error sending initial awareness:', error);
   }
  
 
  const updateHandler = (update: Uint8Array, origin: any) => {

    if (!update || update.length === 0) {
      return;
    }
    
    try {
      
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 0); 
      encoding.writeVarUint(encoder, 1); 
      encoding.writeVarUint8Array(encoder, update); 
      const message = encoding.toUint8Array(encoder);
      
      if (message.length === 0) {
        return;
      }
      
      const clients = docClients.get(docname);
      if (clients && clients.size > 1) {
        const originWs = origin instanceof WebSocket ? origin : null;
        for (const client of clients) {

          if (client === originWs || client === origin) {
            continue;
          }
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
            } catch (error) {
              console.error('Error sending doc update:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error encoding update for broadcast:', error);
    }
  };
  doc.on('update', updateHandler);
  
  const awarenessUpdateHandler = (changes: {added: number[], updated: number[], removed: number[]}, origin: any) => {
 
    if (origin === ws) return;
    
    const changedClients = changes.added.concat(changes.updated, changes.removed);
    if (changedClients.length === 0) return;
    
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 1);
    const awarenessUpdate = awareness.encodeAwarenessUpdate(awarenessState, changedClients);
    encoding.writeVarUint8Array(encoder, awarenessUpdate);
    const message = encoding.toUint8Array(encoder);
    
    const clients = docClients.get(docname);
    if (clients) {
      for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            console.error('Error sending awareness update:', error);
          }
        }
      }
    }
  };
  awarenessState.on('update', awarenessUpdateHandler);
   
   ws.on('message',(rawMsg:ArrayBuffer)=>{
    try {
      const msg=new Uint8Array(rawMsg);
      if (msg.length === 0) {
        console.warn('Received empty message');
        return;
      }
      
      const decoder=decoding.createDecoder(msg)
      const messageType=decoding.readVarUint(decoder);
      
      if(messageType===0){
          const encoder=encoding.createEncoder()
          encoding.writeVarUint(encoder,0)
          
          try {
         
            syncProtocol.readSyncMessage(decoder,encoder,doc,ws)
            
            const response = encoding.toUint8Array(encoder);
            if(response.length>0 && ws.readyState===WebSocket.OPEN){
              ws.send(response)  
            }
          } catch (syncError: any) {
            console.error('Error reading sync message:', syncError);
            console.error('Sync error stack:', syncError?.stack);
          
          }       
      }
      else if(messageType===1){

          try {
            const awUpdate = decoding.readVarUint8Array(decoder);
            if (awUpdate && awUpdate.length > 0) {
              awareness.applyAwarenessUpdate(awarenessState,awUpdate,ws)
            }
          } catch (awError) {
            console.error('Error reading awareness update:', awError);
          }
      }
      else if(messageType===2){
          
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, 1);
          const update = awareness.encodeAwarenessUpdate(awarenessState, Array.from(awarenessState.getStates().keys()));
          encoding.writeVarUint8Array(encoder, update);
          if(ws.readyState === WebSocket.OPEN){
            ws.send(encoding.toUint8Array(encoder));
          }
      } else {
        console.warn('Unknown message type:', messageType);
      }
    } catch (error) {
      console.error('Error processing YJS message:', error);
      
    }
   })
   ws.on('error', (error) => {
     console.error('WebSocket error:', error);
   });

   ws.on('close',(code, reason)=>{
    console.log('yjs client disconnected', { code, reason: reason?.toString() });
    clearInterval(pingInterval);
     const clients = docClients.get(docname);
    if (clients) {
      clients.delete(ws);
    }
    
    doc.off('update', updateHandler);
    awarenessState.off('update', awarenessUpdateHandler);

    if (clients && clients.size === 0) {
      docs.delete(docname);
      docClients.delete(docname);
      docAwareness.delete(docname);
    }
  });

   })   



}
module.exports=initYjsWS;