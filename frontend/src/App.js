import React,{ useState , useEffect } from "react";
import {Routes, Route,useNavigate } from "react-router-dom"

import Navigation from "./components/Navigation";
import Content from "./components/Content";
import Login from "./components/Login";
import Protected from "./components/Protected";
import Register from "./components/Register";

export const UserContext = React.createContext([])

function App() {
  const [user, setUser] = useState({});
  const navigate = useNavigate()

const logOutCallback = async () => {
    localStorage.removeItem('accesstoken');
    await fetch('http://localhost:4000/logout', {
      method: 'POST',
      credentials: 'include'
    })
    // clear user from Context
    setUser({})
    // navigate back to startpage
    navigate('/');
}


useEffect(()=>{

},[])

  return (
    <UserContext.Provider value={[user, setUser]}>

    <div className="App">
      <Navigation logoutCallback={logOutCallback} />

      <Routes>
        <Route path="/" element={<Content />} />
        <Route path="/protected" element={<Protected />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
    </UserContext.Provider>
  );
}

export default App;
