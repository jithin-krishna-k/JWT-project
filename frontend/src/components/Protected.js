import { useEffect,useState,useContext } from 'react'
import { UserContext } from '../App'

const Protected = () => {
  const [user] = useContext(UserContext)
  const [content, setContent] = useState("You need to login!")


  useEffect(()=>{
    async function fetchprotected(){
      const response =await fetch("http://localhost:4000/protected",{
        method : 'POST',
        headers:{
          'content-type':'application/json',
          authorization: `Bearer ${user.accesstoken}`
        },
      })
      const result = await response.json();
      if(result.data) setContent (result.data);
    }
    fetchprotected()
  },[user])
  return <div className='text'> {content} </div>
}

export default Protected