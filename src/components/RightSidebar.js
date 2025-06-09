import { useEffect, useState, useRef } from "react";
import { Download, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function RightSidebar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Invalid user JSON in localStorage", e);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/auth/login");
  };

  const trends = [
    { tag: "#ClimateChange", count: "25 Posts and Polls" },
    { tag: "#AbortionRights", count: "18 Posts and Polls" },
    { tag: "#voiceofpeople", count: "7 Posts and Polls" },
    { tag: "#Election2024", count: "6 Posts and Polls" },
    { tag: "#food", count: "6 Posts and Polls" },
    { tag: "#Economy", count: "5 Posts and Polls" },
  ];

  return (
    <aside className="border-l border-gray-200 h-screen overflow-y-auto bg-white flex flex-col">
      {/* Top Buttons */}
      <div className="flex items-center justify-between mb-6 gap-2 border-b border-gray-200 p-4 py-5">
        <button className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-xl bg-white text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400 border-gradient-to-r from-pink-500 to-orange-400 hover:opacity-80 transition border-2 border-pink-500">
          <Download className="w-4 h-4 text-pink-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
            Get the App
          </span>
        </button>

        {!user ? (
          <button
            className="text-sm font-medium text-white px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90 transition"
            onClick={() => navigate("/auth/login")}
          >
            Sign In
          </button>
        ) : (
          <div className="flex items-center gap-3 relative" ref={menuRef}>
            <button
              className="relative"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="text-gray-700 w-9 h-9 border border-gray-200 border-1.5 rounded-lg p-2 bg-gray-100" />
            </button>

            {/* Profile Picture Dropdown */}
            <button onClick={() => setMenuOpen(!menuOpen)}>
              <img
                src={
                  user.profile
                    ? `https://assets-stage.queryloom.com/${user.profile}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
                }
                alt="Profile"
                className="w-9 h-9 rounded-lg object-cover border border-gray-200"
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    navigate(`/user/${user.user_name}`, { state: { userId: user.id } });
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Your Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trending Section */}
      <div className="flex-1 p-5 pt-0">
        <h2 className="text-sm font-semibold text-black mb-4">TRENDING</h2>
        <div className="space-y-4">
          {trends.map((trend, index) => {
            const cleanTag = trend.tag.replace("#", "");
            return (
              <Link to={`/tag/${encodeURIComponent(cleanTag)}`} key={index}>
                <div className="text-sm text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2 transition cursor-pointer">
                  <p className="font-medium text-black">{trend.tag}</p>
                  <p className="text-gray-500">{trend.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
