import { useState } from "react";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import TopNavbar from "../components/TopNavbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false); // Add this

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <div className="max-w-[1450px] mx-auto h-full flex">
        {/* Left Sidebar */}
        <aside
          className={`transition-all duration-300 ${
            collapsed ? "w-20" : "w-64"
          } bg-white border-r border-gray-200 overflow-y-auto`}
        >
          <LeftSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </aside>

        {/* Main Section */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar />
          <div className="flex overflow-y-auto bg-gray-100">
            <Outlet />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
