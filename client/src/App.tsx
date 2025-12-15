import Login from "./pages/Login"
import Session from "./pages/Session"
import Room from "./pages/Room"
import { Routes,Route } from "react-router-dom"


function App() {

  return (
    <>
    
    <Routes>
      <Route path='/login'  element={<Login/>}/>
      <Route path='/'  element={<Session/>}/>
      <Route path="/room/:sessionid" element={<Room/>}/>
    </Routes>
    </>
  )
}

export default App
