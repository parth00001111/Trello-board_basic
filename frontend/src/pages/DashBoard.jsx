import logo from "../assets/logo.png";
import { useState, useEffect } from "react"
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react"
const DashBoard = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [organizations, setOrganizations] = useState([]);

   const username = document.cookie
    .split("; ")
    .find((row) => row.startsWith("username="))
    ?.split("=")[1];

  const navigate = useNavigate();

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/organization`, {
        withCredentials: true
      });
      setOrganizations(res.data.organizations);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

 const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      const response = await axios.post(`http://localhost:5000/organization`, {
        title: title, 
        description: description
      }, {
        withCredentials: true
      })
      console.log(response.data);
      alert("Organization created successfully")
    }catch(err){
      console.log(err.message);
      setError(err.message)
      
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className=" min-h-screen w-screen bg-linear-to-br from-orange-50 via-amber-50 to-rose-50 font-sans">
      {/* div 1 */}
      <div className="flex justify-between w-screen bg-white h-25 shadow-xl items-center">
        <div className="flex items-center">
          <img
            onClick={() => navigate("/")}
            className="h-20 w-30 cursor-pointer"
            src={logo}
            alt="TaskFlow Logo"
          />
          <h1 className="text-4xl font-bold mt-1">TaskFlow</h1>
          <span className="h-10 border border-gray-200 mt-5 ml-10"></span>
          <p className="text-orange-500 text-2xl ml-7 mt-4 font-medium">
            Dashboard
          </p>
          <span className="w-32 border border-orange-500 -ml-30 mt-17"></span>
        </div>
        {/* div 2 */}

        <div className="pr-8 flex w-90">
          <p className=" font-medium flex-1 ml-15 mt-4 text-2xl">
            Hi {username},  
          </p>
          <button onClick={() => navigate("/signin")} className="bg-orange-500 h-15 w-35 rounded-2xl text-xl text-white hover:bg-orange-600">Logout</button>
        </div>
      </div>

      {/* hero Section */}
      <div className="flex ">

        <div className="h-160 w-120 bg-white m-20 shadow-xl rounded-3xl flex flex-col items-start px-10 py-8">
          <h1 className="text-4xl font-medium mt-7">Create Organization</h1>
          <p className="text-xl mt-4 text-gray-500">Create a new organization to manage your projects and teams.</p>
          <form className="w-full mt-5" onSubmit={handleSubmit}>
            <div>
            <label className="text-2xl font-medium">Organization Name</label>
            <input className="w-full h-12 border text-xl border-gray-300 rounded-xl px-4 mt-2 outline-orange-500" type="text" onChange={(e) => setTitle(e.target.value)} value={title} name="title" required placeholder="Enter organization name" />
            </div>
            <div className="mt-5">
            <label className="text-2xl font-medium">Description</label>
            <textarea required="none" className="w-full h-45 border border-gray-300 text-xl rounded-xl px-4 py-3  resize focus:outline-none focus:border-orange-500" type="text" onChange={(e) => setDescription(e.target.value)} value={description} name="description" placeholder="Enter organization description (optional)" />
            <p className="text-sm text-gray-400 text-right -mt-9 mr-3">{description.length} / 300</p>
            </div>
            <button type="submit" disabled={loading} className="flex bg-orange-500 hover:bg-orange-600 gap-4 h-14 justify-center items-center rounded-xl w-100 mt-10 cursor-pointer">
              <Building2 className="text-white h-15" />
              <p className="text-white text-xl">{loading ? "Creating..." : "Create Organization"}</p>
              
              </button>

          </form>
        </div>
        <div></div>

      </div>
    </div>
  );
};

export default DashBoard;