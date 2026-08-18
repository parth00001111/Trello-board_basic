import logo from "../assets/logo.png";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, ExternalLink } from "lucide-react";

const DashBoard = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const navigate = useNavigate();

  // Full name cookie extracted from the cookie and decoded to get the first name of the user for greeting purposes.
  const fullName = decodeURIComponent(
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("username="))
      ?.split("=")[1] || ""
  );

  
  const firstName = fullName.split(" ")[0];

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/organizations`, {
        withCredentials: true,
      });
      setOrganizations(res.data.organizations);
      console.log(res.data.organizations);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5000/organization`,
        {
          title: title,
          description: description,
        },
        {
          withCredentials: true,
        }
      );
      console.log(response.data);
      setTitle("");
      setDescription("");
      alert("Organization created successfully");
      fetchOrganizations();
    } catch (err) {
      console.log(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `http://localhost:5000/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      navigate("/signin");
    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-linear-to-br from-orange-50 via-amber-50 to-rose-50 font-sans">
      {/* Navbar */}
      <div className="flex justify-between w-screen bg-white h-25 shadow-md items-center">
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

        {/* Only First Name + Logout */}
        <div className="pr-8 flex items-center gap-5">
          <p className="text-gray-500 text-xl font-normal">
            Hi {firstName},
          </p>

          <button
            onClick={logout}
            className="bg-orange-500 h-15 px-10 rounded-2xl text-xl text-white hover:bg-orange-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex">
        {/* Create Organization Card */}
        <div className="h-160 w-120 bg-white m-20 shadow-xl rounded-3xl flex flex-col items-start px-10 py-8">
          <h1 className="text-4xl font-medium mt-7">Create Organization</h1>
          <p className="text-xl mt-4 text-gray-500">
            Create a new organization to manage your projects and teams.
          </p>

          <form className="w-full mt-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-2xl font-medium">Organization Name</label>
              <input
                className="w-full h-12 border text-xl border-gray-300 rounded-xl px-4 mt-2 outline-orange-500"
                type="text"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                name="title"
                required
                placeholder="Enter organization name"
              />
            </div>

            <div className="mt-5">
              <label className="text-2xl font-medium">Description</label>
              <textarea
                className="w-full h-45 border border-gray-300 text-xl rounded-xl px-4 py-3 resize focus:outline-none focus:border-orange-500"
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                name="description"
                placeholder="Enter organization description (optional)"
                maxLength={300}
              />
              <p className="text-sm text-gray-400 text-right -mt-9 mr-3">
                {description.length} / 300
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex bg-orange-500 hover:bg-orange-600 gap-2 h-14 justify-center items-center rounded-xl w-100 mt-10 cursor-pointer"
            >
              <Plus className="text-white h-10 w-9" />
              <p className="text-white text-2xl mb-1">
                {loading ? "Creating..." : "Create Organization"}
              </p>
            </button>
          </form>
        </div>

        {/* Organizations List */}
        <div>
          <h1 className="text-5xl font-medium mt-7 ml-20">Your Organizations</h1>
          <p className="text-gray-500 ml-21 text-xl mt-3">
            Open an organization to access projects, tasks and team members.
          </p>

          <div className="flex flex-wrap gap-10 mt-5 ml-20">
            {organizations.map((org) => (
              <div
                key={org._id}
                className="h-40 w-140 bg-white shadow-md rounded-2xl p-4"
              >
                <h2 className="text-4xl font-bold">{org.title}</h2>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xl text-gray-500">{org.description}</p>
                  <div
                    onClick={() => navigate(`/organizations/${org._id}`)}
                    className="bg-orange-500 gap-3 h-13 w-50 cursor-pointer rounded-2xl text-xl text-white flex justify-center items-center hover:bg-orange-600"
                  >
                    <p>Open</p>
                    <ExternalLink className="text-center" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;