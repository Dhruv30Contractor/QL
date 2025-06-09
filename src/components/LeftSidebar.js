import {
  Flame,
  Lightbulb,
  Leaf,
  Palette,
  Plane,
  Film,
  Newspaper,
  Smile,
  GraduationCap,
  ChevronLeft,
  Clock,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

export default function LeftSidebar({ collapsed, setCollapsed }) {
  const postRoutes = [
    { label: "Trending", icon: Flame, path: "/" },
    { label: "Latest", icon: Newspaper, path: "/latest" },
    { label: "Following", icon: Smile, path: "/following" },
    { label: "Interests", icon: Lightbulb, path: "/interests" },
    { label: "Inner Circle", icon: GraduationCap, path: "/inner-circle" },
    { label: "My Posts", icon: Palette, path: "/my-posts" },
    { label: "Saved Posts", icon: Leaf, path: "/saved-posts" },
    { label: "Scheduled Posts", icon: Clock, path: "/scheduled-posts" },
  ];

  const menuItems = [
    { icon: Lightbulb, label: "Technology & Innovation" },
    { icon: Leaf, label: "Environment & Sustainability" },
    { icon: Palette, label: "Art & Design" },
    { icon: Plane, label: "Travel & Exploration" },
    { icon: Film, label: "Entertainment" },
    { icon: Newspaper, label: "News & Current Events" },
    { icon: Smile, label: "Memes & Internet Trends" },
    { icon: GraduationCap, label: "Education & Learning" },
  ];

  return (
    <div
      className={`h-full w-full overflow-y-auto no-scrollbar flex flex-col bg-white shadow-sm ${
        collapsed ? "items-center" : ""
      }`}
    >
      {/* Logo & Toggle */}
      <div
        className={`flex items-center border-b border-gray-200 p-4 py-5 w-full sticky top-0 z-10 bg-white ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <img
          src="/logo.png"
          alt="Logo"
          className={`h-10 cursor-pointer transition-all duration-300 ${
            collapsed ? "mx-auto" : ""
          }`}
          onClick={() => setCollapsed(!collapsed)}
        />
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-gray-400 border border-gray-300 rounded-full hover:text-rose-500 hover:border-rose-500 p-1 transition"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Posts Section */}
      <div className="px-4 pt-6 pb-4 w-full border-b border-gray-200">
        {!collapsed && (
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Posts
          </h2>
        )}
        <ul
          className={`space-y-3 text-sm font-medium ${
            collapsed ? "flex flex-col items-center" : "text-gray-700"
          }`}
        >
          {postRoutes.map((item, index) => {
            const content = (
              <li
                className={`group flex items-center gap-2 px-2 py-2 rounded-md transition-colors cursor-pointer hover:bg-rose-50 hover:text-rose-600 ${
                  collapsed ? "justify-center w-10 h-10" : ""
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="truncate text-sm font-semibold">
                    {item.label}
                  </span>
                )}
              </li>
            );

            return collapsed ? (
              <Tippy
                key={index}
                content={item.label}
                placement="right"
                delay={[300, 0]}
              >
                <Link to={item.path}>{content}</Link>
              </Tippy>
            ) : (
              <Link key={index} to={item.path}>
                {content}
              </Link>
            );
          })}
        </ul>
      </div>

      {/* Interests Section */}
      <div className="px-4 pt-6 pb-10 w-full">
        {!collapsed && (
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Interests / Topics
          </h2>
        )}
        <ul
          className={`text-[13px] font-medium ${
            collapsed
              ? "flex flex-col items-center gap-2"
              : "text-gray-700 space-y-3"
          }`}
        >
          {menuItems.map((item, index) => {
            const pathLabel = item.label.replace(/&/g, "and");
            const path = `/interest/${encodeURIComponent(pathLabel)}`;

            const content = (
              <li
                className={`group flex items-center gap-2 px-2 py-2 rounded-md transition-colors cursor-pointer hover:bg-rose-50 hover:text-rose-600 ${
                  collapsed ? "justify-center w-10 h-10" : ""
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="truncate text-[13px]">{item.label}</span>
                )}
              </li>
            );

            return collapsed ? (
              <Tippy
                key={index}
                content={item.label}
                placement="right"
                delay={[300, 0]}
              >
                <Link to={path}>{content}</Link>
              </Tippy>
            ) : (
              <Link key={index} to={path}>
                {content}
              </Link>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
