// components/notifications/NotificationCard.js
import React from "react";

export default function NotificationCard({
  avatarUrl,
  username,
  message,
  timeAgo,
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-md bg-white shadow-sm my-2">
      <div className="flex items-center gap-4">
        <img
          src={`https://assets-stage.queryloom.com/${avatarUrl}`}
          alt="avatar"
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div>
          <p className="font-semibold text-gray-900">{username}</p>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
      <span className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded-md">
        {timeAgo}
      </span>
    </div>
  );
}
