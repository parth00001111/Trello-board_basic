import logoPng from "../assets/logo.png";
import play from "../assets/play.png"
import { useNavigate } from "react-router-dom"
import team from "../assets/visual.png"
import LandingPageImg from "../assets/LandingImage.png"
import laptop from "../assets/laptop.png"
import growth from "../assets/growth.png"

const LandingPage = () => {

  const navigate = useNavigate();
  const dashFun = () => {
    navigate("/")
  }
  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-orange-50 via-amber-50 to-rose-50 font-sans ">
      
      {/*Navbar*/}
      <div className="flex justify-between">
        <div className="mt-4 flex">
          <img onClick={dashFun} className="h-20 w-30 ml-15" src={logoPng} alt="error occured"/>
          <h1 className="text-4xl font-bold mt-5 ">TaskFlow</h1>
        </div>

        <div className="flex justify-between gap-10 pt-10 text-xl pl-10">
          <span className="hover:text-orange-500 cursor-pointer">Features</span>
          <span className="hover:text-orange-500 cursor-pointer">Pricing</span>
          <span className="hover:text-orange-500 cursor-pointer">About</span>
        </div>
            
        <div className="flex gap-5 pb-2 mr-15 text-xl">
          <button onClick={() => navigate("/signin")} className="w-30 h-15 bg-gray-100 hover:bg-gray-200 rounded-4xl mt-5 border border-gray-400">Login</button>
          <button onClick={() =>navigate("/signup") } className=" bg-orange-500 hover:bg-orange-600 mt-5 h-15 rounded-4xl text-white w-50">Create Account</button>
          
        </div>
        
      </div>

      {/* heroSection */}

      <div className="flex justify-between">
        <div className="p-15 mt-10 ml-20">
          <h1 className="text-7xl font-bold tracking-wider">Organize Work.</h1>
          <h1 className="text-7xl font-bold tracking-wider mb-5">Move faster.</h1>
          <div>
            <span className="text-2xl tracking-wider text-gray-600">Task flow is a simple, visual way to manage projects,</span><br/>
            <span className="text-2xl tracking-wider text-gray-600">collaborate with your team, and deliever results.</span><br/>
          </div>
            <div className="mt-5 h-10 flex gap-5">
              <button onClick={() => navigate("/signup")} className="w-50 bg-orange-500 h-15 text-white text-xl rounded-4xl cursor-pointer hover:bg-orange-600">Get Started Free</button>
              <div className="h-15 w-46 bg-gray-100 hover:bg-gray-200 rounded-4xl flex items-center justify-center gap-2 border border-gray-400 cursor-pointer">
                <img src={play} />
                <span className=" text-xl">Demo Video</span>
              </div>

            </div>
        </div>
        <div>
          <img className="h-150 mr-20 w-236" src={ LandingPageImg } />
        </div>

      </div>

      {/* Hero Section */}
      <div className="flex justify-between w-screen">
        <div className="bg-white h-45 leading-4 w-110 px-5  rounded-3xl ml-30 flex  shadow-xl hover:shadow-2xl -mt-10 gap-6">
          <div>
            <img className=" pl-5 mt-7 h-10 w-30 "  src={laptop} />
          </div>
          <div>
              <h1 className="font-bold text-3xl mt-5 ml-2">Visual Project Board</h1>
              <p className="text-xl text-gray-500 px-2 hover: ">Organize task and projects visually so nothing falls through the cracks</p>
          </div>
        </div>
        <div className="bg-white h-45 leading-4 w-110 px-5  rounded-3xl ml-15 flex  shadow-xl hover:shadow-2xl -mt-10 gap-6">
          <div>
            <img className="pl-5 mt-5 h-10 w-30"  src={team} />
          </div>
          <div>
              <h1 className="font-bold text-3xl mt-5 ">Team Collaboration</h1>
              <p className="text-xl text-gray-500 ">Collaborate in real time, share feedback, and keep everyone aligned </p>
          </div>
        </div>
        <div className="bg-white h-45 leading-4 w-110 px-2  rounded-3xl ml-15 flex  shadow-xl hover:shadow-2xl -mt-10 gap-6 mr-50">
          <div>
            <img className=" pl-5 mt-5 h-10 w-20"  src={growth} />
          </div>
          <div>
              <h1 className="font-bold text-3xl mt-5">Track Progress</h1>
              <p className="text-xl text-gray-500 ">Organize task and projects <br/> visually so nothing falls <br/>through the cracks</p>
              
          </div>
        </div>
       
      </div>
      
    </div>
  )
}

export default LandingPage
