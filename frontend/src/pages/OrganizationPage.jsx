import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { House, Building2, Plus, ExternalLink } from "lucide-react"
import logo from "../assets/logo.png";

const OrganizationPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    const [boardTitle, setBoardTitle] = useState("");
    const [boards, setBoards] = useState([]);
    const [members, setMembers] = useState([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const username = document.cookie.split("; ").find((row) => row.startsWith("username="))?.split("=")[1];

    const fetchOrganization = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/organization/${id}`, {
                withCredentials: true
            });
            setOrganization(res.data.organization);
        } catch (err) {
            console.log(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchBoards = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/boards`, {
                params: { organizationId: id },
                withCredentials: true
            });
            setBoards(res.data.Boards);
        } catch (err) {
            console.log(err.message);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/members`, {
                params: { organizationId: id },
                withCredentials: true
            });
            setMembers(res.data.members);
        } catch (err) {
            console.log(err.message);
        }
    };

    useEffect(() => {
        fetchOrganization();
        fetchBoards();
        fetchMembers();
    }, [id]);

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await axios.post(`http://localhost:5000/board`, {
                title: boardTitle,
                organizationId: id
            }, {
                withCredentials: true
            });
            setBoardTitle("");
            fetchBoards();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setCreating(false);
        }
    };

    const logout = async () => {
        try {
            await axios.post(`http://localhost:5000/logout`, {}, {
                withCredentials: true
            });
            navigate("/signin");
        } catch (err) {
            console.log(err.message);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen w-screen bg-linear-to-br from-orange-50 via-amber-50 to-rose-50 flex items-center justify-center">
                <p className="text-2xl text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen bg-linear-to-br from-orange-50 via-amber-50 to-rose-50 font-sans">
            {/* navbar */}
          <div className="flex justify-between items-center h-25 bg-white shadow-md px-5">
            <div className="flex items-center justify-center">
             <img onClick={() => navigate("/")} className="h-20 w-30 cursor-pointer" src={logo} alt="TaskFlow Logo"/>
              <h1 className="text-4xl font-bold mt-1">TaskFlow</h1>
              <div className="flex items-center gap-2 ml-10 mt-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <House className="text-gray-600 h-7 w-7" />
              <p className="text-xl text-gray-600">Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
                <Building2 className="text-orange-500 h-7 w-7" />
                <h1 className="text-xl font-semibold">{organization?.title}</h1>
            </div>

            <div className="flex items-center gap-4">
              <p className="font-medium text-2xl">Hi {username},</p>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <p className="text-orange-500 font-semibold text-lg">
                  {username?.charAt(0).toUpperCase()}
                </p>
              </div>
              <button onClick={logout} className="bg-orange-500 h-15 w-35 rounded-2xl text-xl text-white hover:bg-orange-600">Logout</button>
            </div>
          </div>

          {/* main section */}
          <div className="flex">

            {/* Create Board */}
            <div className="w-120 bg-white m-20 shadow-xl rounded-3xl flex flex-col px-10 py-8">
              <h1 className="text-3xl font-bold">Create Board</h1>
              <p className="text-gray-500 mt-3">Create a new board to organize tasks and collaborate with your team.</p>

              <form className="w-full mt-6 flex flex-col gap-2" onSubmit={handleCreateBoard}>
                <label className="text-lg font-bold">Board Title</label>
                <input
                  className="w-full h-12 border border-gray-300 rounded-xl px-4 text-base focus:outline-none focus:border-orange-500"
                  type="text"
                  placeholder="Enter board title (e.g. Website Redesign)"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  required
                />

                <button type="submit" disabled={creating} className="flex bg-orange-500 hover:bg-orange-600 gap-2 h-14 justify-center items-center rounded-xl w-full mt-8 cursor-pointer disabled:opacity-60">
                  <Plus className="text-white h-6 w-6" />
                  <p className="text-white text-xl">{creating ? "Creating..." : "Create Board"}</p>
                </button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </form>
            </div>

            {/* Boards list */}
            <div className="flex-1 m-20 ml-0">
              <h1 className="text-5xl font-bold">Boards</h1>
              <p className="text-gray-500 mt-2 text-xl">Organize your work into boards and get things done.</p>

              {/* Members row */}
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                {members.map((m) => (
                  <div key={m._id} className="flex items-center gap-2 bg-white shadow-sm px-3 py-2 rounded-full">
                    <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center">
                      <p className="text-orange-500 font-semibold text-sm">
                        {m.username?.charAt(0).toUpperCase()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{m.username}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                {boards.map((board) => (
                  <div key={board._id} className="bg-white shadow-md rounded-2xl p-6">
                    <h1 className="text-3xl font-bold">{board.title}</h1>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-gray-500 text-lg">
                        Created by {board.createdBy?.username} · {formatDate(board.createdAt)}
                      </p>
                      <button
                        onClick={() => navigate(`/board/${board._id}`)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        Open <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
    );
}

export default OrganizationPage