// components/notifications/NotificationTabs.js
import React from "react";

const tabs = [
  "All",
  "Likes",
  "Comments",
  "Polls",
  "Groups",
  "Follows",
  "Invites",
];

export default function NotificationTabs({ selected, onSelect }) {
  return (
    <div className="flex gap-3 py-2 overflow-x-auto bg-gray-100">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`px-4 py-2 rounded-md font-medium ${
            selected === tab
              ? "bg-gradient-to-r from-pink-500 to-orange-400 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
