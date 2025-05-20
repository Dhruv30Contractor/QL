import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  BarChart3,
  MoreHorizontal,
  Bookmark,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import PostModal from "./PostModal";
import { formatDistanceToNow } from "date-fns";

const PostCard = ({ post }) => {
  const [showModal, setShowModal] = useState(false);
  const user = post?.User || {};
  const isPoll = post?.type === "poll";
  const attachments = post.attachments || [];
  const options = post.Options || [];

  const getPercentage = (count) => {
    const total = post.totalVotes || 0;
    return total === 0 ? 0 : Math.round((count / total) * 100);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 space-y-4 w-full">
        {/* User Info */}
        <div className="flex justify-between items-start border-b border-gray-200 p-4">
          <div className="flex gap-3 items-center">
            <img
              src={
                user.profile
                  ? `https://assets-stage.queryloom.com/${user.profile}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.user_name
                    )}`
              }
              alt="profile"
              className="h-10 w-10 rounded-lg object-cover"
            />

            <Link to={`/user/${user.user_name}`} state={{ userId: user.id }}>
              <div className="font-semibold text-sm">{user.name}</div>
              <div className="text-xs text-gray-500">@{user.user_name}</div>
            </Link>
          </div>
          <div className="flex text-xs text-gray-500 gap-2">
            <div className="items-center gap-2">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </div>{" "}
            <MoreHorizontal className="h-4 w-4 text-gray-400 mt-1 cursor-pointer" />
          </div>
        </div>

        {/* Question */}
        <div className="px-4 text-base font-medium">{post.question}</div>

        {/* Meta Info */}
        {isPoll && (
          <div className="px-4 text-sm text-gray-500">
            Votes - {post.totalVotes}
          </div>
        )}

        {/* Attachments for ALL post types */}
        {attachments.length > 0 && (
          <div
            className={`px-4 ${
              attachments.length === 1
                ? "flex justify-center items-center h-[400px]"
                : "grid grid-cols-2 gap-2 h-[400px]"
            }`}
          >
            {attachments.slice(0, 4).map((att, idx) => {
              const url = `https://assets-stage.queryloom.com/${att.attachment}`;
              const isVideo = att.attachment?.match(/\.(mp4|mov|webm)$/i);

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-xl ${
                    attachments.length === 1
                      ? "max-w-[500px] w-full h-full"
                      : "w-full h-full"
                  }`}
                >
                  {isVideo ? (
                    <video
                      src={url}
                      controls
                      className={`w-full h-full rounded-xl ${
                        attachments.length === 1
                          ? "object-contain"
                          : "object-cover"
                      }`}
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`attachment-${idx}`}
                      className={`w-full h-full rounded-xl ${
                        attachments.length === 1
                          ? "object-contain"
                          : "object-cover"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Poll Options */}
        {isPoll && options.length > 0 && (
          <div className="px-4 space-y-3">
            {options.map((opt) => {
              const percent = getPercentage(opt.votesCount);
              return (
                <div
                  key={opt.id}
                  className="relative px-4 py-2 border border-gray-300 rounded-xl text-sm flex justify-between items-center overflow-hidden"
                >
                  {/* Background Bar */}
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-100 to-pink-50"
                    style={{ width: `${percent}%`, zIndex: 0 }}
                  />
                  <span className="z-10">{opt.option}</span>
                  <span className="z-10 font-medium">{percent}%</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Reactions Row */}
        <div className="flex justify-between items-center text-sm text-gray-600 border-t border-gray-200 p-4">
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-gray-600" />
              <span>{post.totalLikes || 0}</span>
            </div>
            <div
              className="flex items-center gap-1"
              onClick={() => setShowModal(true)}
            >
              <MessageCircle className="h-4 w-4 text-gray-600" />
              <span>{post.totalComments || 0}</span>
            </div>
          </div>
          <div className="flex items-center text-gray-600 gap-6 font-medium">
            {/* Save Post */}
            <div className="flex items-center gap-1 cursor-pointer">
              <Bookmark className="h-4 w-4" />
            </div>

            {/* Share Post */}
            <div className="flex items-center gap-1 cursor-pointer">
              <Send className="h-4 w-4" />
            </div>

            {/* View Analytics */}
            <div className="flex items-center gap-1 text-pink-600 cursor-pointer">
              <BarChart3 className="h-4 w-4" />
              <span>View Analytics</span>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <PostModal postId={post.id} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default PostCard;
