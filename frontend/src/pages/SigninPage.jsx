import signupPng from "../assets/signup.png";
import logoPng from "../assets/logo.png";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom"

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/signin", {
        username: username,
        password: password,
      },{
        withCredentials: true
      });

      console.log(response.data);
      alert("signin successful!");
  
      
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || err.message || "Signup failed. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-linear-to-br from-orange-50 via-amber-50 to-rose-50 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl flex overflow-hidden w-220 h-150">
        <div className="flex-1 flex flex-col justify-center px-12 py-10">
          <div className="mb-8">
            <img src={logoPng} alt="Logo" className="h-14 mb-6 -ml-2"  />
            <h1 className="text-3xl font-bold text-gray-800">Login</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Join us and start organizing your work
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Does not have an account?{" "}
            <span onClick={() => navigate("/signup")} className="text-orange-600 font-medium cursor-pointer hover:underline">
              Signup
            </span>
          </p>
        </div>

        <div className="flex-1 relative">
          <img
            src={signupPng}
            alt="Signup"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;