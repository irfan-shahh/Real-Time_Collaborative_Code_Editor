
# Real-Time Collaborative Code Editor

A Real-Time collaborative coding platform that enables multiple developers to write, edit, and debug code together in real-time. Built with Yjs CRDT for conflict-free synchronization, dual WebSocket architecture, and Monaco Editor integration.

DEMO_LINK: https://drive.google.com/file/d/1CC8BPnnwSF56Xxue8mh64T4fKniTgREt/view?usp=sharing

## Overview

This platform delivers seamless real-time collaboration for software development teams, featuring synchronized editing, live cursor tracking, session management, and role-based access control. The system ensures zero-conflict concurrent editing through Yjs CRDT and session management through raw websockets.

## Key Features

### Real-Time Collaboration
- **Conflict-Free Synchronization**: Yjs CRDT (Conflict-free Replicated Data Type) ensures automatic conflict resolution
- **Awareness Protocol**: Synchronized presence information across all participants
- **Instant Updates**: Sub-second propagation of code changes to all connected clients

### Session Management
- **Create & Join Sessions**: Easy session creation with shareable session IDs
- **Role-Based Access Control**: Hierarchical admin/member privilege system
- **Admin Controls**: Session creators can kick users and end sessions
- **Member Management**: Real-time participant list with join timestamps
- **Session Persistence**: Code and state preserved across user connections
- **Graceful Exits**: Proper cleanup when users leave or are removed

### Authentication & Security
- **JWT Authentication**: Secure token-based user authentication
- **HTTP-Only Cookies**: Protected cookie storage preventing XSS attacks
- **Session Validation**: Server-side verification of active sessions
- **User Identity**: Authenticated user profiles with usernames and IDs
- **Authorization Middleware**: Protected routes requiring valid authentication

### Connection Management
- **Dual WebSocket Architecture**: Separate channels for session data and collaborative editing
- **Automatic Reconnection**: Built-in connection recovery and state synchronization
- **Connection State Persistence**: Maintains editing context during brief disconnections
- **Idempotent Message Processing**: Safe handling of duplicate messages and retries
- **Ping/Pong Heartbeat**: Connection health monitoring with 30-second intervals

### User Experience
- **Real-Time Presence**: Live participant list showing active users
- **Join Time Tracking**: Displays how long each user has been in the session
- **Copy Session ID**: One-click copying of session identifiers
- **Responsive Interface**: Optimized layout for desktop environments
- **Error Handling**: Clear feedback for connection issues and failed operations
- **Loading States**: Visual indicators during asynchronous operations

##  Architecture

### System Overview
```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   React      │────────▶│  Express.js  │────────▶│  PostgreSQL  │
│   Frontend   │   JWT   │   REST API   │  Prisma │   Database   │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │
       │ Raw WS                 │
       ├───────────────────────▶│
       │                        │
       │ Yjs WS                 │
       └───────────────────────▶│
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────▼──────┐         ┌─────▼──────┐
              │  Raw WS    │         │  Yjs WS    │
              │  Server    │         │  Server    │
              │ (Session)  │         │  (CRDT)    │
              └────────────┘         └────────────┘
```

### Backend Stack
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **WebSocket**: ws library with dual server implementation
- **CRDT Engine**: Yjs for conflict-free replication
- **Protocols**: Y-protocols for sync and awareness
- **Binary Encoding**: lib0 for efficient message encoding/decoding

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Editor**: Monaco Editor (@monaco-editor/react)
- **State Management**: React Context API + Custom Hooks
- **Routing**: React Router v6 with protected routes
- **Styling**: Tailwind CSS with custom dark theme
- **HTTP Client**: Axios with credential support
- **CRDT Integration**: Yjs with y-websocket provider
- **Editor Binding**: y-monaco for Monaco integration



### Dual WebSocket Architecture

#### Raw WebSocket Server (`/raw-ws`)
**Purpose**: Session management, user presence, and control messages

**Responsibilities**:
- User join/leave events
- Real-time participant list updates
- Admin kick user functionality
- Session validation and termination
- Connection state management

#### Yjs WebSocket Server (`/yjs-ws`)
**Purpose**: Collaborative editing and CRDT synchronization

**Responsibilities**:
- Y.Doc synchronization across clients
- Yjs CRDT (Conflict-free Replicated Data Type) ensures automatic conflict resolution
- Awareness state propagation (cursors, selections)
- Binary protocol message handling
- Document state persistence in memory

**

### WebSocket Security
- **Session Validation**: Server verifies session existence before allowing join
- **User Authentication**: WebSocket connections tied to authenticated users
- **Client ID Tracking**: Unique identifiers prevent duplicate connections
- **Admin Authorization**: Kick/end operations restricted to session creators
- **Connection Cleanup**: Proper resource disposal on disconnect
  
## Future Improvements

- [ ] Multi-file support with file tree navigation
- [ ] Integrated terminal for code execution
- [ ] Syntax highlighting themes and language plugins
- [ ] Video/voice chat integration
- [ ] Screen sharing for debugging sessions
- [ ] Code review and commenting system
- [ ] Session recording and playback
- [ ] Plugin system for custom extensions

---

## What I Learned

- **CRDT Theory**: Understanding operational transformation vs CRDTs and why CRDTs are simpler for 
  distributed systems
- **WebSocket Architecture**: Designing dual-server systems and choosing between binary vs JSON protocols
- **State Synchronization**: Implementing efficient latecomer sync without transferring entire history
- **Connection Resilience**: Handling network interruptions gracefully without losing user state
- **Database Design**: Schema design for multi-tenant collaborative systems with role-based access

---

