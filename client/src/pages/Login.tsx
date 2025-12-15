import React, { type ChangeEvent, useState } from "react";
import { useNavigate } from "react-router-dom";


import { useDataContext } from "../context/useDataContext";

interface RegisterInfo {
  username: string;
  email: string;
  password: string;
}
interface LoginInfo {
  email: string;
  password: string;
}

const registerInitialValues = {
  username: "",
  email: "",
  password: "",
};
const loginInitialValues = {
  email: "",
  password: "",
};

const Login: React.FC = () => {
  const [account, setAccount] = useState<"login" | "register">("login");
  const [registerInfo, setRegisterInfo] =
    useState<RegisterInfo>(registerInitialValues);
  const [loginInfo, setLoginInfo] = useState<LoginInfo>(loginInitialValues);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingR, setIsLoadingR] = useState<boolean>(false);
  const [errorEmail,setErrorEmail]=useState<boolean>(false)
  const [errorPassword,setErrorPassword]=useState<boolean>(false)
  const [existError,setExistError]=useState<boolean>(false)
  const [error,setError]=useState<boolean>(false)
  const [erroralready,setErrorAlready]=useState<boolean>(false)
  const [errorRegister,setErrorRegister]=useState<boolean>(false)
  const [usernameError,setusernameError]=useState<boolean>(false)
  const [invalidError,setInvalidError]=useState<boolean>(false)


  const navigate = useNavigate();
  const { loginUser, registerUser } = useDataContext();
  

  const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 6;
};

  const toggleAccount = () => {
    setAccount((prev) => (prev === "login" ? "register" : "login"));
  };

  const onValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRegisterInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLoginInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const register = async (): Promise<void> => {
    setErrorEmail(false);
    setErrorPassword(false);
    setErrorAlready(false)
    setErrorRegister(false)
    setusernameError(false)
    
     if(!validateEmail(registerInfo.email)){
        setErrorEmail(true)
        return;
      }
      if(!validatePassword(registerInfo.password)){
        setErrorPassword(true)
        return;
      }
    try {
      setIsLoadingR(true);
      const response=await registerUser(registerInfo.username, registerInfo.email, registerInfo.password)
      if (response && response.status==200){
        toggleAccount()
      }
    } catch (error:any) {
      const msg=error?.response?.data?.message
      if(msg==='the user already exists'){
        setErrorAlready(true)
      }
          else if(msg==='username already exists'){
               setusernameError(true)
          }
        
      else{
        setErrorRegister(true)
      }

    } finally {
      setIsLoadingR(false);
    }
  };

  const login = async (): Promise<void> => {
    setErrorEmail(false);
  setErrorPassword(false);
      if(!validateEmail(loginInfo.email)){
        setErrorEmail(true)
        return;
      }
    try {
      setIsLoading(true);
       await loginUser(loginInfo.email, loginInfo.password)
      navigate('/')
     
    } catch (error:any) {
      const msg=error?.response?.data?.message;
      if(msg==='user does not exist'){
        setExistError(true)
      }else if(msg==='invalid password'){
        setInvalidError(true)
      }else{
        setError(true)
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center px-4 text-white">
      <h1 className="text-3xl font-bold mb-1">Collaborative Code Editor</h1>
      <p className="text-gray-300 text-center mb-6 italic mt-4">
        Code •Collaborate • Create
      </p>

      <div className="w-full max-w-md bg-[#2a2a2a] p-6 rounded-xl shadow-md border border-gray-700">
        <h3 className="text-xl font-semibold text-center mb-4">
          {account === "login" ? "Login" : "Register"}
        </h3>

        {account === "login" ? (
          <>
            <input
              placeholder="Email"
              name="email"
              value={loginInfo.email}
              onChange={onInputChange}
              className="w-full px-3 py-2 mb-3 bg-[#3a3a3a] text-white border border-gray-600 rounded focus:outline-none"
            />
            <input
              placeholder="Password"
              type="password"
              name="password"
              value={loginInfo.password}
              onChange={onInputChange}
              className="w-full px-3 py-2 mb-4 bg-[#3a3a3a] text-white border border-gray-600 rounded focus:outline-none"
            />
            {errorEmail && <p className="text-red-400 mb-2 text-center">kindly provide a valid email !</p>}
            {existError && <p className="text-red-400 mb-2 text-center">User doesnot exist !</p>}
            {invalidError && <p className="text-red-400 mb-2 text-center">password is incorrect !</p>}
            {error && <p className="text-red-400 mb-2 text-center">Login failed </p>}

            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded disabled:opacity-50 cursor-pointer"
              onClick={login}
              
              disabled={!loginInfo.email || !loginInfo.password}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
            <p className="text-center mt-4 text-gray-400 ">OR</p>
            <button
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded cursor-pointer"
            >
              Sign in with Google
            </button>
            <button
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded cursor-pointer"
            >
              Sign in with GitHub
            </button>




            <button
              className="text-blue-400 w-full mt-2 cursor-pointer"
              onClick={toggleAccount}
            >
              New user? Register here
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="username"
              name="username"
              value={registerInfo.username}
              onChange={onValueChange}
              className="w-full px-3 py-2 mb-3 bg-[#3a3a3a] text-white border border-gray-600 rounded focus:outline-none"
            />
            <input
              placeholder="Email"
              name="email"
              value={registerInfo.email}
              onChange={onValueChange}
              className="w-full px-3 py-2 mb-3 bg-[#3a3a3a] text-white border border-gray-600 rounded focus:outline-none"
            />
            <input
              placeholder="Password"
              type="password"
              name="password"
              value={registerInfo.password}
              onChange={onValueChange}
              className="w-full px-3 py-2 mb-4 bg-[#3a3a3a] text-white border border-gray-600 rounded focus:outline-none"
            />
                {errorEmail && <p className="text-red-400 mb-2 text-center">kindly provide a valid email</p>}
                {errorPassword && <p className="text-red-400 mb-2 text-center">password has to be minimum 6 chars</p>}
                {erroralready && <p className="text-red-400 mb-2 text-center">Email is already registered</p>}
                {usernameError && <p className="text-red-400 mb-2 text-center">username already exists,try another</p>}
                {errorRegister && <p className="text-red-400 mb-2 text-center">Error while registering... try again</p>}
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded disabled:opacity-50 cursor-pointer"
              onClick={register}
              disabled={
                !registerInfo.username ||
                !registerInfo.email ||
                !registerInfo.password
              }
            >
              {isLoadingR ? "Registering..." : "Register"}
            </button>

            <p className="text-center mt-4 text-gray-400">OR</p>

            <button
              className="text-blue-400 w-full mt-2 cursor-pointer"
              onClick={toggleAccount}
            >
              Already have an account? Login here
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
