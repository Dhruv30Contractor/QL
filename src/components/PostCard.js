import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  BarChart3,
  MoreHorizontal,
  Bookmark,
  Send,
  Copy,
  Edit,
  EyeOff,
  Trash2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { BASE_URL } from "../config"; // adjust path as needed
import { createPortal } from "react-dom";
import PollForm from "./PollForm";
import PostForm from "./PostForm";
import PortalDropdown from "./PortalDropdown";
import ScheduleModal from "./ScheduleModal";

const PostCard = ({ post, onOpenModal, onUnsave, onDelete, onUpdate }) => {
  const user = post?.User || {};
  const isPoll = post?.type === "poll";
  const attachments = post.attachments || [];
  const options = post.Options || [];

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner = currentUser.id === user.id;
  const [isUnpublished, setIsUnpublished] = useState(post?.status === "unpublished" || post?.unpublish === true);

  // Initialize liked state based on post data
  const [liked, setLiked] = useState(post?.isLiked === 1 || post?.isLiked === true);
  const [likesCount, setLikesCount] = useState(post?.totalLikes || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [pollOptions, setPollOptions] = useState(options);
  const [isSaved, setIsSaved] = useState(post?.isSaved || false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const navigate = useNavigate();

  const dropdownButtonRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const handleDropdownOpen = () => {
    setShowDropdown(true);
    if (dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.right - 192 }); // 192 = dropdown width
    }
  };

  // Update like state when post data changes
  useEffect(() => {
    setLiked(post?.isLiked === 1 || post?.isLiked === true);
    setLikesCount(post?.totalLikes || 0);
  }, [post?.isLiked, post?.totalLikes]);

  const getPercentage = (count) => {
    const total = pollOptions.reduce((sum, opt) => sum + opt.votesCount, 0);
    return total === 0 ? 0 : Math.round((count / total) * 100);
  };

  const handleVote = async (optionId) => {
    if (!isPoll || selectedOptionId === optionId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found.");
      return;
    }

    try {
      const payload = {
        poll_id: post.id,
        option_id: optionId,
      };

      const response = await axios.post(
        `${BASE_URL}/polls/answer-poll`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.message === "Vote added successfully") {
        setSelectedOptionId(optionId);

        // Update local poll option counts
        const updatedOptions = pollOptions.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, votesCount: (opt.votesCount || 0) + 1 };
          }
          if (opt.id === selectedOptionId) {
            return {
              ...opt,
              votesCount: Math.max((opt.votesCount || 1) - 1, 0),
            };
          }
          return opt;
        });

        setPollOptions(updatedOptions);
      } else {
        console.warn("Vote failed: ", response.data.message);
      }
    } catch (error) {
      console.error("Error voting: ", error);
    }
  };

  const handleLike = async () => {
    if (isLoading) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found.");
      return;
    }

    try {
      setIsLoading(true);

      const payload = liked ?
        {
          poll_id: post.id,
          dislike: 1,
          delete: 1,
        } :
        {
          poll_id: post.id,
          dislike: 0,
          delete: 0,
        };

      console.log("Sending like payload:", payload);

      const response = await axios.post(`${BASE_URL}/likes/poll`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Like response:", response.data);

      if (response.data.status) {
        setLiked(!liked);
        setLikesCount(prev => prev + (liked ? -1 : 1));
      } else {
        console.warn("Like/Unlike failed: ", response.data.message);
        alert(response.data.message || "Failed to like/unlike post.");
      }
    } catch (error) {
      console.error("Error liking/unliking post: ", error);
      alert("An error occurred while liking/unliking.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found.");
      return;
    }

    try {
      // Send the opposite of current state to toggle
      const willUnsave = isSaved ? 1 : 0;

      const response = await axios.post(
        `${BASE_URL}/polls/save-poll/${post.id}`,
        { unsave: willUnsave },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Toggle the save state based on the action
      if (willUnsave) {
        // We tried to unsave, so now it should be unsaved
        setIsSaved(false);
        // Notify parent component about unsave
        if (onUnsave) {
          onUnsave(post.id);
        }
      } else {
        // We tried to save, so now it should be saved
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      // Revert the state on error
      setIsSaved(!isSaved);
    }
  };

  const handleCopyLink = () => {
    // Create a slug from the question by:
    // 1. Converting to lowercase
    // 2. Replacing spaces with hyphens
    // 3. Removing special characters
    const slug = post.question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const postLink = `/user/${user.user_name}/${slug}-${post.id}`;
    navigator.clipboard.writeText(window.location.origin + postLink);
    setIsCopied(true);
    setShowDropdown(false);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEditPost = () => {
    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams();
    searchParams.set("from", currentPath);
    searchParams.set("fromId", user.user_name);
    searchParams.set("scrollPos", window.scrollY);
    
    navigate(`/edit-post/${post.id}?${searchParams.toString()}`);
    setShowDropdown(false);
  };

  const handleUnpublish = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        alert("Authentication token missing. Please log in again.");
        return;
      }
  
      console.log("Attempting to unpublish poll with ID:", post.id);
  
      const response = await fetch(`${BASE_URL}/polls/unpublish/${post.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // No 'Content-Type' header and no body
        },
      });
  
      const data = await response.json();
      console.log("Unpublish response:", data);
  
      if (
        data &&
        data.status === true &&
        data.message === "Poll unpublished successfully"
      ) {
        setIsUnpublished(true);
      } else {
        throw new Error("Failed to unpublish poll: Invalid response format");
      }
    } catch (error) {
      console.error("Error unpublishing post:", error);
      alert("Failed to unpublish post. Please try again.");
    }
  
    setShowDropdown(false);
  };
  

  const handleDelete = async () => {
    try {
      const response = await axios.put(
        `${BASE_URL}/polls/edit/${post.id}`,
        { del: 1 },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.status) {
        if (typeof onDelete === "function") onDelete(post.id);
      } else {
        throw new Error(response.data.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(error.message || "Failed to delete post");
    }
    setShowDropdown(false);
  };

  // Helper for menu items
  const MenuItem = ({ icon, children, onClick, className = "" }) => (
    <button
      className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 transition text-left ${className}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );

  const isScheduled = post.scheduled === 1 || post.scheduled === "1" || post.scheduled === true;

  // Add stubs for missing handlers
  const handlePublishNow = async () => {
    try {
      setShowDropdown(false); // Close the dropdown
  
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");
  
      const formData = new FormData();
      formData.append("scheduled_date", null); // or null, but "" is safer for FormData
  
      const response = await fetch(`${BASE_URL}/polls/edit/${post.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Do NOT set Content-Type, browser will set it for FormData
        },
        body: formData,
      });
  
      const result = await response.json();
  
      if (response.ok && result.status) {
        console.log("Poll published immediately:", result.message);
        // Optionally: remove it from scheduled list or trigger a refresh
        if (typeof onDelete === "function") onDelete(post.id); // Remove from UI
      } else {
        console.error("Failed to publish poll:", result.message || result);
      }
    } catch (error) {
      console.error("Error while publishing poll:", error.message);
    }
    setShowDropdown(false);
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true);
    setShowDropdown(false);
  };

  const handleRescheduleSave = async (scheduledDate) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("scheduled_date", scheduledDate);

      const response = await fetch(`${BASE_URL}/polls/edit/${post.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Do NOT set Content-Type for FormData
        },
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.status) {
        // alert("Poll rescheduled successfully!");
        setShowRescheduleModal(false);
        // if (typeof onDelete === "function") onDelete(post.id); // Remove from current list if needed
        if (typeof onUpdate === "function") onUpdate({...post, scheduled_date: scheduledDate }); // if API returns updated post
      } else {
        alert(result.message || "Failed to reschedule poll.");
      }
    } catch (error) {
      alert("Error while rescheduling poll: " + error.message);
    }
  };

  const handleRepublish = () => {
    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams();
    searchParams.set("from", currentPath);
    searchParams.set("scrollPos", window.scrollY);
    searchParams.set("fromId", ""); // You can set user_name if needed
    searchParams.set("republish", "true");
    navigate(`/republish-post/${post.id}?${searchParams.toString()}`);
    setShowDropdown(false);
  };

  console.log("isScheduled", isScheduled, post.scheduled, post.scheduled_date);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 space-y-4 w-full overflow-visible">
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
          <div>
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
            })}
          </div>
          <div className="relative">
            <button
              ref={dropdownButtonRef}
              onClick={handleDropdownOpen}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
            {showDropdown && (
              <>
                {/* Overlay to block clicks behind the dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                  style={{ background: "transparent" }}
                />
                <PortalDropdown>
                  <div
                    className="w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
                    style={{
                      position: "fixed",
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                    }}
                  >
                    {isScheduled ? (
                      <>
                        <MenuItem icon={<Send size={16} />} onClick={handlePublishNow}>Publish Now</MenuItem>
                        <MenuItem icon={<Edit size={16} />} onClick={handleEditPost}>Edit Post</MenuItem>
                        <MenuItem icon={<Clock size={16} />} onClick={handleReschedule}>Reschedule Post</MenuItem>
                        <MenuItem icon={<Trash2 size={16} />} onClick={handleDelete}>Delete</MenuItem>
                      </>
                    ) : isUnpublished ? (
                      <>
                        <MenuItem icon={<RefreshCw size={16} />} onClick={handleRepublish}>Republish</MenuItem>
                        <MenuItem icon={<Trash2 size={16} />} onClick={handleDelete}>Delete</MenuItem>
                      </>
                    ) : (
                      <>
                        <MenuItem icon={<Copy size={16} />} onClick={handleCopyLink}>{isCopied ? "Copied!" : "Copy Link"}</MenuItem>
                        <MenuItem icon={<Edit size={16} />} onClick={handleEditPost}>Edit Post</MenuItem>
                        <MenuItem icon={<EyeOff size={16} />} onClick={handleUnpublish}>Unpublish</MenuItem>
                        <MenuItem icon={<RefreshCw size={16} />} onClick={handleRepublish}>Republish</MenuItem>
                        <MenuItem icon={<Trash2 size={16} />} onClick={handleDelete}>Delete</MenuItem>
                      </>
                    )}
                  </div>
                </PortalDropdown>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="px-4 text-base font-medium">{post.question}</div>

      {/* Meta Info */}
      <div className="px-4 text-sm text-gray-500 flex items-center gap-2">
        {isPoll && <span>Votes - {post.totalVotes}</span>}
        {isUnpublished && (
          <span className="bg-orange-400 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
            Unpublished
          </span>
        )}
      </div>

      {/* Attachments */}
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

      {/* Poll Options with Voting */}
      {isPoll && pollOptions.length > 0 && (
        <div className="px-4 space-y-3">
          {pollOptions.map((opt) => {
            const percent = getPercentage(opt.votesCount);
            const isSelected = selectedOptionId === opt.id;

            return (
              <div
                key={opt.id}
                onClick={isUnpublished ? null : () => handleVote(opt.id)}
                className={`relative px-4 py-2 border rounded-xl text-sm flex justify-between items-center overflow-hidden transition-all duration-200 ${
                  isSelected ? "border-pink-500" : "border-gray-300"
                }`}
                style={{ backgroundColor: isSelected ? "#fff0f5" : "white" }}
              >
                {/* Vote fill layer */}
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                    isSelected ? "bg-pink-200" : "bg-gray-100"
                  }`}
                  style={{
                    width: `${percent}%`,
                    zIndex: 0,
                  }}
                />

                {/* Option Text and Percentage (Foreground) */}
                <div className="flex justify-between items-center w-full z-10">
                  <span className="font-medium">{opt.option}</span>
                  <span className="font-semibold">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reactions */}
      <div className="flex justify-between items-center text-sm text-gray-600 border-t border-gray-200 p-4">
        <div className="flex gap-6 items-center">
          <div
            className={`flex items-center gap-1 ${isUnpublished ? "" : "cursor-pointer"}`}
            onClick={isUnpublished ? null : handleLike}
          >
            <Heart
              className={`h-4 w-4 ${
                liked ? "text-pink-600 fill-pink-600" : "text-gray-600"
              }`}
            />
            <span>{likesCount}</span>
          </div>
          <div
            className={`flex items-center gap-1 ${isUnpublished ? "" : "cursor-pointer"}`}
            onClick={isUnpublished ? null : () => onOpenModal(post.id)}
          >
            <MessageCircle className="h-4 w-4 text-gray-600" />
            <span>{post.totalComments || 0}</span>
          </div>
        </div>
        <div className="flex items-center text-gray-600 gap-6 font-medium">
          <div
            className={`flex items-center gap-1 ${isUnpublished ? "" : "cursor-pointer"}`}
            onClick={isUnpublished ? null : handleSaveToggle}
          >
            <Bookmark
              className={`h-4 w-4 transition-all duration-200 ${
                isSaved ? "text-pink-600 fill-pink-600" : "text-gray-600"}
              `}
            />
          </div>

          <div className={`flex items-center gap-1 ${isUnpublished ? "" : "cursor-pointer"}`}>
            <Send className="h-4 w-4" />
          </div>
          <div className={`flex items-center gap-1 text-pink-600 ${isUnpublished ? "" : "cursor-pointer"}`}>
            <BarChart3 className="h-4 w-4" />
            <span>View Analytics</span>
          </div>
        </div>
      </div>

      {showRescheduleModal && (
        <ScheduleModal
          onClose={() => setShowRescheduleModal(false)}
          onSchedule={(date) => {
            handleRescheduleSave(date.toISOString().slice(0, 19).replace('T', ' '));
          }}
          initialDate={post.scheduled_date}
        />
      )}
    </div>
  );
};

export default PostCard;