// pages/notifications/index.js
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import NotificationTabs from "../components/notifications/NotificationTabs";
import NotificationCard from "../components/notifications/NotificationCard";
import { BASE_URL } from "../config";

export default function NotificationsPage() {
  const [selectedTab, setSelectedTab] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await axios.get(`${BASE_URL}/user/notifications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: {
            page: 1,
            limit: 20,
            filter:
              selectedTab.toLowerCase() === "all"
                ? "all"
                : selectedTab.toLowerCase(),
          },
        });

        const [meta, data] = response.data;

        setUnreadCount(meta.unread_count || 0);
        setNotifications(data || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    }

    fetchNotifications();
  }, [selectedTab]);

  return (
    <div className="w-full">
      <div
       className="flex items-center gap-3 p-4 bg-white sticky top-0 z-20 border-b border-gray-200"
       onClick={() => window.history.back()}
       >
        <ArrowLeft className="text-pink-600 cursor-pointer" />
        <h2 className="text-xl font-bold">Notifications</h2>
        {unreadCount > 0 && (
          <span className="ml-auto text-sm text-red-600">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="flex flex-col m-5 rouded-xl space-y-5 overflow-y-auto no-scrollbar">
        <NotificationTabs selected={selectedTab} onSelect={setSelectedTab} />

        <div className="mt-6 text-sm text-gray-500 font-semibold">Older</div>

        <div className="mt-2">
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              avatarUrl={`${notif.actionByUser?.profile}`}
              username={notif.actionByUser?.user_name}
              message={notif.action}
              timeAgo={formatTimeAgo(notif.createdAt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Utility: Convert ISO date to "5 days ago"
function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (mins > 0) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  return "just now";
}
