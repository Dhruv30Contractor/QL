import React, { useEffect, useState } from "react";
import {
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    Paperclip,
    Smile,
    X,
    SendHorizontal,
} from "lucide-react";
import { BASE_URL } from "../config";

const PostModal = ({ postId, onClose }) => {
    const [comment, setComment] = useState("");
    const [userProfile, setUserProfile] = useState("");
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Set logged-in user's profile
        try {
            const userData = localStorage.getItem("user");
            if (userData) {
                const parsed = JSON.parse(userData);
                if (parsed.profile) {
                    setUserProfile(
                        `https://assets-stage.queryloom.com/${parsed.profile}`
                    );
                } else {
                    setUserProfile(
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            parsed.name || "User"
                        )}`
                    );
                }
            }
        } catch (err) {
            console.error("Error parsing user:", err);
        }
    }, []);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${BASE_URL}/polls/${postId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch post data");
                }

                const data = await response.json();
                setPost(data);
            } catch (error) {
                console.error("Error fetching post data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    const addComment = async () => {
        if (!comment.trim()) {
            return; // Don't submit empty comments
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${BASE_URL}/comment/add-comment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        post_id: postId, // The ID of the post to comment on
                        comment: comment.trim(), // The comment text
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to add comment");
            }

            const data = await response.json();

            // **Important:** Update the `post` state with the new comment
            setPost((prevPost) => {
                if (!prevPost) return prevPost; // Handle potential null post

                return {
                    ...prevPost,
                    comments: [
                        ...(prevPost.comments || []), // Ensure comments is not undefined
                        {
                            id: data.id, // comment id
                            text: comment.trim(),
                            username: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).user_name : 'Anonymous',
                            createdAt: new Date().toISOString(),
                            likes: 0,
                            dislikes: 0,
                            profile: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).profile : null
                        }
                    ],
                };
            });

            // Clear the comment input
            setComment("");
        } catch (error) {
            console.error("Error adding comment:", error);
            // Handle error (e.g., display an error message)
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    if (!post || !post.user) {
        return null; // or show an error fallback UI
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            {/* Close button */}
            <button
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
                onClick={onClose}
                aria-label="Close modal"
            >
                <X size={24} />
            </button>

            <div className="bg-white w-full max-w-6xl h-[95vh] rounded-2xl overflow-hidden shadow-xl flex">
                {/* Left side */}
                <div className="w-1/2 overflow-y-auto flex flex-col">
                    {/* Post Header */}
                    <div
                        className="flex items-center gap-4 border-b p-4"
                        style={{ minHeight: "77px" }}
                    >
                        <img
                            src={`https://assets-stage.queryloom.com/${post.user.profile}`}
                            alt={`${post.user.name} profile`}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                            <div className="font-semibold text-gray-900">
                                {post.user.name}
                            </div>
                            <div className="text-sm text-gray-500">{post.user.username}</div>
                        </div>
                        <div className="ml-auto text-sm text-gray-500 whitespace-nowrap">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Question */}
                    <div className="text-lg font-medium whitespace-pre-line px-4 py-4 border-b">
                        {post.question}
                    </div>

                    {/* Attachments */}
                    {post.attachments?.length > 0 && (
                        <div
                            className={`px-4 py-4 ${post.attachments.length === 1
                                ? "flex justify-center items-center h-[400px]"
                                : "grid grid-cols-2 gap-2 h-[400px]"
                                }`}
                        >
                            {post.attachments.slice(0, 4).map((att, idx) => {
                                const url = `https://assets-stage.queryloom.com/${att.attachment}`;
                                const isVideo = att.attachment.match(/\.(mp4|mov|webm)$/i);

                                return (
                                    <div
                                        key={idx}
                                        className="relative overflow-hidden rounded-xl w-full h-full"
                                    >
                                        {isVideo ? (
                                            <video
                                                src={url}
                                                controls
                                                className="w-full h-full rounded-xl object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={url}
                                                alt={`attachment-${idx}`}
                                                className="w-full h-full rounded-xl object-cover"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right side */}
                <div className="w-1/2 border-l flex flex-col justify-between">
                    <div className="overflow-y-auto flex-grow">
                        <div
                            className="text-base font-semibold border-b p-4 flex items-center"
                            style={{ minHeight: "77px" }}
                        >
                            All Comments
                        </div>

                        <div className="p-4">
                            {post.comments.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-start gap-3 mb-4 bg-gray-100 rounded-xl p-3"
                                >
                                    <img
                                        src={`https://assets-stage.queryloom.com/${c.profile}`}
                                        alt={`${c.username} profile`}
                                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm font-medium text-gray-900">
                                            <span>{c.username}</span>
                                            <span className="text-gray-400 whitespace-nowrap">
                                                {c.createdAt}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">{c.text}</p>
                                        <div className="flex gap-4 text-sm mt-2 text-gray-500">
                                            <button
                                                className="hover:text-black flex items-center gap-1"
                                                aria-label="Like comment"
                                            >
                                                <ThumbsUp size={16} /> {c.likes}
                                            </button>
                                            <button
                                                className="hover:text-black flex items-center gap-1"
                                                aria-label="Dislike comment"
                                            >
                                                <ThumbsDown size={16} /> {c.dislikes}
                                            </button>
                                            <button
                                                className="hover:text-black flex items-center gap-1"
                                                aria-label="Reply to comment"
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comment Input */}
                    <div className="border-t p-4 flex items-start gap-3">
                        <img
                            src={userProfile}
                            alt="Your profile"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 mt-1"
                        />
                        <div className="flex-1 relative">
                            <textarea
                                rows={4}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add your comment..."
                                maxLength={300}
                                className="text-gray-500 w-full border rounded-xl p-3 pb-10 pr-28 text-sm resize-none outline-none border-gray-300 focus:ring-2 focus:ring-pink-500 transition bg-gray-100"
                            />
                            <div className="absolute bottom-4 left-3 flex gap-2 text-gray-500">
                                <button className="hover:text-black" aria-label="Attach file">
                                    <Paperclip size={20} />
                                </button>
                                <button className="hover:text-black" aria-label="Add emoji">
                                    <Smile size={20} />
                                </button>
                            </div>
                            <div className="absolute bottom-4 right-3 text-xs flex justify-end items-center text-gray-400 gap-2">
                                <p className="pb-1">{comment.length} / 300</p>
                                <button
                                    className="bg-gradient-to-br from-pink-500 to-orange-400 text-white p-2 rounded-lg hover:scale-105 transition"
                                    aria-label="Send comment"
                                    disabled={comment.trim().length === 0}
                                    onClick={addComment}
                                >
                                    <SendHorizontal size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostModal;