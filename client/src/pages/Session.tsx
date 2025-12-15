import React, { useState } from "react";
import { useDataContext } from "../context/useDataContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const Session: React.FC = () => {
  const url='http://localhost:8000'
  const [showJoinInput, setShowJoinInput] = useState<boolean>(false);
  const [sessionError, setsessionError] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [joinerror, setJoinError] = useState<boolean>(false);
  const [joinExistError, setJoinExistError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isloading, setisLoading] = useState<boolean>(false);
  const [sessionNO,setSessionNo]=useState<string>('')
  const {user}=useDataContext()
  const navigate=useNavigate()
  axios.defaults.withCredentials=true


  const{logout,setUser}=useDataContext()

    const handleLogout= async()=>{
          await logout()
          setUser(null)
          navigate('/login')
    }

  const createSession=async()=>{
    setsessionError(false)
    setError(false)
    try {
      setLoading(true)
      const response= await axios.post(`${url}/createSession`)
      const sessionId=response.data.sessionId; 
      navigate(`/room/${sessionId}`)
        
    } catch (error:any) {
       const msg=error?.response?.data?.message;
       if(msg==='error while generating sessionid'){
          setsessionError(true)
       }else{
         setError(true)
       }
    }finally{
      setLoading(false)
    }
  }
  const joinSession=async()=>{
             setJoinError(false);
             setJoinExistError(false)
          try {
               setisLoading(true)
              const response= await axios.post(`${url}/joinSession`,{sessionId:sessionNO})
              if(response.status===200){

                navigate(`/room/${sessionNO}`)
              }
          } catch (error:any) {
            const msg=error?.response?.data?.message;
            if(msg==='session does not exist'){
                setJoinExistError(true)
            }else{
              setJoinError(true)
            }
          }finally{
            setisLoading(false)
          }
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center text-white px-4">

      <h1 className="text-3xl font-bold mb-2">Collaborative Code Editor</h1>
      <p className="text-gray-300 italic mb-10">Code • Collaborate • Create</p>
      <p className="text-gray-300 italic mb-10 text-xl">{`Welcome! ${user?.username}`}</p>

      <div className="w-full max-w-md bg-[#2a2a2a] p-8 rounded-xl shadow-md border border-gray-700 text-center">

        <h3 className="text-xl font-semibold mb-6">Start a Coding Session</h3>
        
 
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded mb-4 transition cursor-pointer"
         onClick={createSession}>
          {loading ?"Creating a session ...":"Create a session"}
        </button>
        {error && <p className="text-red-400 mb-2 text-center">Error while creating the room ,try again</p>}
        {sessionError && <p className="text-red-400 mb-2 text-center"> Unable to create the room,internal server error,try again!</p>}
        {!showJoinInput ? (
          <button
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition cursor-pointer "
            onClick={() => setShowJoinInput(true)}
            
          >
            Join a Session
          </button>
        ) : (
          <div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Session ID"
              className="flex-1 px-3 py-2 rounded bg-[#1e1e1e] border border-gray-600 text-white focus:outline-none"
            onChange={(e)=>setSessionNo(e.target.value)} />
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition cursor-pointer"
            onClick={joinSession}
            >
              {isloading ?"Joining":"Join"}
            </button>
          </div>

          {joinerror && <p className="text-red-400 mb-2 text-center">Can't join the session.try again!</p>}
          {joinExistError && <p className="text-red-400 mb-2 text-center">session doesn't exist.</p>}
          </div>
        )}
       

      </div>
      <button className="bg-red-500 hover:bg-red-600 text-white py-2 rounded transition cursor-pointer w-[200px] mt-2" 
      onClick={handleLogout}>Logout</button>

    </div>
  );
};

export default Session;
