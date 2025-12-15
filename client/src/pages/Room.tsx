import React, { useEffect, useState, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid'
import { useDataContext } from "../context/useDataContext";

import * as Y from 'yjs'
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

const Room: React.FC = () => {
  const url = "http://localhost:8000";
  const WS_URL = "ws://localhost:8000/raw-ws"
  const YJS_WS = `ws://localhost:8000/yjs-ws`

  axios.defaults.withCredentials = true;

  const navigate = useNavigate();
  const { sessionid } = useParams();
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEndError, setAdminEndError] = useState(false);
  const [memberExitError, setMemberExitError] = useState(false);
  const [sessionUsers, setSessionUsers] = useState([]);
  const wsRef = useRef<WebSocket | null>(null)
  const [tick, setTick] = useState<number>(0);
  const { user } = useDataContext()
  const editorRef = useRef<any | null>(null)
  const [editorReady, setEditorReady] = useState(false);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
 



  const copyId = () => {
    if (!sessionid) return;
    navigator.clipboard.writeText(sessionid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const checkRole = async () => {
      const response = await axios.post(`${url}/joinSession`, {
        sessionId: sessionid,
      });
      setIsAdmin(response.data.adminId === response.data.userId);
    };
    checkRole();
  }, []);

  const endorexitSession = async () => {
    try {
      const response = await axios.post(`${url}/exitSession`, {
        sessionId: sessionid,
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "leave",
          sessionId: sessionid,
          isAdmin: isAdmin
        }));
      }
      localStorage.removeItem('clientId')
      localStorage.removeItem(`joinedAt_${sessionid}`)

      if (response.status === 200) {
        navigate("/", { replace: true });
      }
    } catch (error) {
      isAdmin ? setAdminEndError(true) : setMemberExitError(true);
    }
  };
  const timeAgo = (timestamp: number) => {

    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60)
      return `just now`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
      return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24)
      return `${hours} hr${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30)
      return `${days} day${days === 1 ? "" : "s"} ago`;

  }

  let cid = localStorage.getItem('clientId');
  if (!cid) {
    cid = uuidv4();
    localStorage.setItem("clientId", cid)
  }
  const clientIdRef = useRef(cid)

  let savedJoinedAt = localStorage.getItem(`joinedAt_${sessionid}`);
  if (!savedJoinedAt) {
    savedJoinedAt = Date.now().toString();
    localStorage.setItem(`joinedAt_${sessionid}`, savedJoinedAt);
  }

  const kickUser = (targetUserId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "kickUser",
      sessionId: sessionid,
      targetUserId
    }));
  };

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        type: 'join',
        sessionId: sessionid,
        clientId: clientIdRef.current,
        user: {
          id: user?.id,
          username: user?.username,
          joinedAt: Number(savedJoinedAt)
        }
      }))
      ws.send(JSON.stringify({
        type: 'verifySession',
        sessionId: sessionid
      }))
    })
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'sessionValid') {
        console.log('session OK')
      }
      if (msg.type === 'sessionInvalid') {
        navigate('/', { replace: true })
      }
      if (msg.type === 'usersList') {
        setSessionUsers(msg.users)
      }
      if (msg.type === "kicked") {

        localStorage.removeItem("clientId");
        localStorage.removeItem(`joinedAt_${sessionid}`);

        if (providerRef.current) {
          providerRef.current.destroy();
          providerRef.current = null;
        }

        if (ydocRef.current) {
          ydocRef.current.destroy();
          ydocRef.current = null;
        }

        navigate("/", { replace: true });
      }



      if (msg.type === 'sessionEnded') {
        localStorage.removeItem('clientId')
        localStorage.removeItem(`joinedAt_${sessionid}`)
        if (wsRef.current) wsRef.current.close();

        if (providerRef.current) {
          providerRef.current.destroy();
          providerRef.current = null;
        }

        if (ydocRef.current) {
          ydocRef.current.destroy();
          ydocRef.current = null;
        }

        navigate("/", { replace: true });
      }
    })
    return () => ws.close();

  }, [sessionid, user])


  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1)
    }, 60000);
    return () => {
      clearInterval(id)
    }
  }, [])


  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    setEditorReady(true)

  }

  useEffect(() => {
    if (!sessionid || !editorRef.current || !editorReady) {
      return;
    }
    if (!ydocRef.current) {

      ydocRef.current = new Y.Doc();
    }
    if (!providerRef.current) {
      providerRef.current = new WebsocketProvider(YJS_WS, sessionid, ydocRef.current)
      providerRef.current.on('status', (e) => {
        console.log('yjs-ws status', e.status)
        if (e.status === 'disconnected') {
          console.warn('YJS WebSocket disconnected');
        } else if (e.status === 'connected') {
          console.log('YJS WebSocket connected');
        }
      })
      providerRef.current.on('sync', (isSynced) => {
        console.log('YJS sync status:', isSynced);
      })

      providerRef.current.awareness.setLocalState({
        user: {
          id: user?.id,
          username: user?.username,
          color: `#` + Math.floor(Math.random() * 16777215).toString(16)
        },
        cursor: null,
        typing: false
      })
    }
    const editor = editorRef.current;
    const ytext = ydocRef.current.getText('monaco')
    const model = editor.getModel()
    if (!bindingRef.current) {

      bindingRef.current = new MonacoBinding(ytext, model, new Set([editor]), providerRef.current.awareness)
    }
    
    
    return () => {

      if (bindingRef.current) {
        bindingRef.current!.destroy()
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
    }
  }, [sessionid, editorReady])

  return (
    <div className="h-screen w-full flex bg-[#1e1e1e] text-white">

      <div className="flex-1 border-r border-gray-700">
        <Editor height="100%" defaultLanguage="javascript" theme="vs-dark"
          onMount={handleEditorMount}
        />
      </div>


      <div className="w-[28%] p-4 bg-[#252525] flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold mb-2">Session Room</h2>
            <div className="hidden">{tick}</div>
            <button
              className="px-4 py-2 rounded cursor-pointer mr-2 mb-2 bg-[#1e1e1e] hover:bg-zinc-900 text-red-600"
              onClick={endorexitSession}
            >
              {isAdmin ? "End Session" : "Exit Room"}
            </button>
          </div>

          {adminEndError && (
            <p className="text-red-400 text-center">Can't end session, try again</p>
          )}
          {memberExitError && (
            <p className="text-red-400 text-center">Can't exit room, try again</p>
          )}

          <div className="flex items-center justify-between bg-[#1e1e1e] px-3 py-2 rounded border border-gray-700">
            <span className="text-sm text-gray-300 truncate">{sessionid}</span>
            <button
              onClick={copyId}
              className="text-sm bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded cursor-pointer"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>


        <div className="h-[px] bg-gray-700 w-full"></div>
        <div className="flex flex-col gap-3 overflow-y-auto">
          <h3 className="text-lg font-semibold">{`Members (${sessionUsers.length})`}</h3>

          <div className="flex flex-col gap-2">
            {sessionUsers.map((u: any) => (
              <div
                key={u.id}
                className="p-3 bg-[#1e1e1e] rounded-lg border border-gray-700 shadow-sm"
              >
                <p className="font-semibold text-white">{
                  u?.id === user?.id ? `${u.username} (you)` : u.username
                }</p>
                <p className="text-xs text-gray-400">
                  Joined • {timeAgo(u.joinedAt)}
                </p>
                {isAdmin && u.id !== user?.id && (
                  <button
                    className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded cursor-pointer"
                    onClick={() => kickUser(u.id)}
                  >
                    Kick
                  </button>
                )}



              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Room;
