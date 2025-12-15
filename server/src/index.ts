
const express = require('express')
const cors = require('cors')
const http = require('http')
const { WebSocketServer } = require('ws')
import type { WebSocket as wstype } from 'ws';
import type { Duplex } from 'stream'
import type { IncomingMessage } from 'http'

const initRawWs = require('./ws/rawWebSocket')
const initYjsWS = require('./ws/YjsWebSocket')


interface WS extends wstype {
  clientId?: string,
  sessionId?: string,
  user?: {
    id: string,
    username: string,
    joinedAt: number
  }
}
require('dotenv').config()
const cookieParser = require('cookie-parser')
const appRouter = require('./routes/route')
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use('/', appRouter)


const server = http.createServer(app)
const wssRaw = new WebSocketServer({ noServer: true,clientTracking:true })
const wssYjs = new WebSocketServer({ noServer: true ,clientTracking:true })

server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
  const url = req.url || ''
  if (!url) {
    return socket.destroy();
  }
  if (url.startsWith('/raw-ws')) {
    wssRaw.handleUpgrade(req, socket, head, (ws: WS) => {
      wssRaw.emit('connection', ws, req)
    })
  } else if (url.startsWith("/yjs-ws")) {
    wssYjs.handleUpgrade(req, socket, head, (ws: wstype) => {
      wssYjs.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})
initRawWs(wssRaw);
initYjsWS(wssYjs)

const port = process.env.PORT || 8000;

const start = async (): Promise<void> => {
  try {
    server.listen(port, () => {
      console.log(`websocket + http server is running on port ${port}`)
    })

  }
  catch (error) {
    console.error('Error connecting to the server/database:', error);
  }
}

start()