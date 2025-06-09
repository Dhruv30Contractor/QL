import React, { useEffect, useState } from "react";
import {
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    Paperclip,
    Smile,
    X,
    SendHorizontal,
    Edit,
    Trash2,
    Redo,
} from "lucide-react";
import { BASE_URL } from "../config";

const PostModal = ({ postId, onClose }) => {
    const [comment, setComment] = useState("");
    const [commentAttachment, setCommentAttachment] = useState(null);
    const [userProfile, setUserProfile] = useState("");
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [likedComments, setLikedComments] = useState([]);
    const [dislikedComments, setDislikedComments] = useState([]);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState("");
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [replyingToUsername, setReplyingToUsername] = useState("");
    const [replyText, setReplyText] = useState("");
    const [replyAttachment, setReplyAttachment] = useState(null);
    const [replies, setReplies] = useState({});
    const [showReplies, setShowReplies] = useState({});
    const [likeLoading, setLikeLoading] = useState({});
    const [dislikeLoading, setDislikeLoading] = useState({});
    const [selectedPollOption, setSelectedPollOption] = useState(null);
    const [pollOptionsState, setPollOptionsState] = useState([]);

    //Fetching user data
    const userData = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))
        : null;

    useEffect(() => {
        try {
            if (userData) {
                if (userData.profile) {
                    setUserProfile(
                        `https://assets-stage.queryloom.com/${userData.profile}`
                    );
                } else {
                    setUserProfile(
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userData.name || "User"
                        )}`
                    );
                }
            }
        } catch (err) {
            console.error("Error parsing user:", err);
        }
    }, [userData]);

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${BASE_URL}/comment/fetch?poll_id=${postId}&parent_comment_id=&page=&limit=&action=comments&order=newest}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch comments");

            const data = await response.json();
            setComments(data.comments || []);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${BASE_URL}/polls/${postId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch post data");

                const data = await response.json();
                setPost(data[0]);
                if (data[0]?.type === 'poll') {
                    setSelectedPollOption(data[0]?.chosen_option_id || null);
                    setPollOptionsState(data[0]?.Options || []);
                }
            } catch (error) {
                console.error("Error fetching post data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
        fetchComments();
    }, [postId]);

    const addComment = async () => {
        if (!comment.trim() && !commentAttachment) return;

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            if (comment.trim()) {
                formData.append("text", comment.trim());
            }
            if (commentAttachment) {
                formData.append("file", commentAttachment);
            }
            formData.append("poll_id", postId);
            if (replyingToCommentId) {
                formData.append("parent_comment_id", replyingToCommentId);
            }

            const response = await fetch(`${BASE_URL}/comment/add-comment`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to add comment");

            const data = await response.json();
            if (replyingToCommentId) {
                fetchReplies(replyingToCommentId);
            } else {
                fetchComments();
            }
            setComment("");
            setCommentAttachment(null);
            setReplyingToCommentId(null);
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleCommentAttachment = (e) => {
        if (e.target.files && e.target.files[0]) {
            setCommentAttachment(e.target.files[0]);
        }
    };

    const handleVote = async (optionId) => {
        if (post?.type !== 'poll') {
            console.log("Not a poll.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No token found. Cannot vote.");
            return;
        }

        try {
            const payload = {
                poll_id: postId,
                option_id: optionId,
            };

            const response = await fetch(`${BASE_URL}/polls/answer-poll`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error("Vote failed:", errorData?.message || response.statusText);
                throw new Error("Failed to submit vote");
            }

            const result = await response.json();
            console.log("Vote successful:", result);

            // Update selected option
            setSelectedPollOption(optionId);

            // Update poll options with vote counts
            setPollOptionsState(prevOptions =>
                prevOptions.map(opt => {
                    if (opt.id === optionId) {
                        return { ...opt, votesCount: (opt.votesCount || 0) + 1 };
                    }
                    if (opt.id === selectedPollOption) {
                        return { ...opt, votesCount: Math.max((opt.votesCount || 1) - 1, 0) };
                    }
                    return opt;
                })
            );

        } catch (error) {
            console.error("Error submitting vote:", error);
        }
    };

    const handleLikeComment = async (commentId, isSub = false, parentId = null) => {
        if (likeLoading[commentId]) return;
        setLikeLoading(prev => ({ ...prev, [commentId]: true }));
        try {
            const token = localStorage.getItem("token");
            const isLiked = likedComments.includes(commentId);
            const wasDisliked = dislikedComments.includes(commentId); // Check if was disliked
            const del = isLiked ? 1 : 0;
            const response = await fetch(`${BASE_URL}/likes/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    comment_id: commentId,
                    del: del,
                    dislike: 0, // Liking action
                    poll_id: postId,
                }),
            });
            if (!response.ok) throw new Error("Failed to like/unlike comment");

            // Update state based on the action and previous state
            if (isSub && parentId) {
                setReplies(prev => ({
                    ...prev,
                    [parentId]: (prev[parentId] || []).map(c =>
                        c.id === commentId
                            ? {
                                ...c,
                                // Adjust counts based on action and previous state
                                likesCount: isLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0) + 1,
                                dislikesCount: wasDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : (c.dislikesCount || 0),
                                // Update user reaction state
                                userLike: isLiked ? null : 1,
                                userDislike: null,
                            }
                            : c
                    ),
                }));
            } else {
                setComments(prevComments =>
                    prevComments.map(c =>
                        c.id === commentId
                            ? {
                                ...c,
                                // Adjust counts based on action and previous state
                                likesCount: isLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0) + 1,
                                dislikesCount: wasDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : (c.dislikesCount || 0),
                                // Update user reaction state
                                userLike: isLiked ? null : 1,
                                userDislike: null,
                            }
                            : c
                    )
                );
            }

            // Update local arrays tracking user's reactions
            setLikedComments(prev =>
                isLiked ? prev.filter(id => id !== commentId) : [...prev, commentId]
            );
            setDislikedComments(prev => prev.filter(id => id !== commentId)); // Remove from disliked if it was there

        } catch (error) {
            console.error("Error liking comment:", error);
        } finally {
            setLikeLoading(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const handleDislikeComment = async (commentId, isSub = false, parentId = null) => {
        if (dislikeLoading[commentId]) return;
        setDislikeLoading(prev => ({ ...prev, [commentId]: true }));
        try {
            const token = localStorage.getItem("token");
            const isDisliked = dislikedComments.includes(commentId);
            const wasLiked = likedComments.includes(commentId); // Check if was liked
            const del = isDisliked ? 1 : 0;
            const response = await fetch(`${BASE_URL}/likes/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    comment_id: commentId,
                    del: del,
                    dislike: !isDisliked ? 1 : 0, // Disliking action (toggle)
                    poll_id: postId,
                }),
            });
            if (!response.ok) throw new Error("Failed to dislike/undislike comment");

            // Update state based on the action and previous state
            if (isSub && parentId) {
                setReplies(prev => ({
                    ...prev,
                    [parentId]: (prev[parentId] || []).map(c =>
                        c.id === commentId
                            ? {
                                ...c,
                                 // Adjust counts based on action and previous state
                                dislikesCount: isDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : (c.dislikesCount || 0) + 1,
                                likesCount: wasLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0),
                                // Update user reaction state
                                userDislike: isDisliked ? null : 1,
                                userLike: null,
                            }
                            : c
                    ),
                }));
            } else {
                setComments(prevComments =>
                    prevComments.map(c =>
                        c.id === commentId
                            ? {
                                ...c,
                                 // Adjust counts based on action and previous state
                                dislikesCount: isDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : (c.dislikesCount || 0) + 1,
                                likesCount: wasLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0),
                                // Update user reaction state
                                userDislike: isDisliked ? null : 1,
                                userLike: null,
                            }
                            : c
                    )
                );
            }

            // Update local arrays tracking user's reactions
            setDislikedComments(prev =>
                isDisliked ? prev.filter(id => id !== commentId) : [...prev, commentId]
            );
            setLikedComments(prev => prev.filter(id => id !== commentId)); // Remove from liked if it was there

        } catch (error) {
            console.error("Error disliking comment:", error);
        } finally {
            setDislikeLoading(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const handleStartEdit = async (commentId, text) => {
        setEditingCommentId(commentId);
        setEditText(text);
    };

    const handleEditComment = async (commentId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BASE_URL}/comment/edit/${commentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    text: editText.trim(), // Use editText state for the edited text
                }),
            });

            if (!response.ok) throw new Error("Failed to edit comment");

            const data = await response.json();

            //Update list of comments
            setComments((prevComments) =>
                prevComments.map((c) => {
                    if (c.id === commentId) {
                        return { ...c, text: data.data.text };
                    }
                    return c;
                })
            );

            setEditingCommentId(null);

        } catch (error) {
            console.error("Error editing comment:", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BASE_URL}/comment/remove/${commentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete comment");

            setComments((prevComments) => prevComments.filter((c) => c.id !== commentId));
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const fetchReplies = async (commentId, page = 1, limit = 5) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${BASE_URL}/comment/fetch?poll_id=${postId}&parent_comment_id=${commentId}&page=${page}&limit=${limit}&action=comments`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch replies");

            const data = await response.json();
            setReplies(prev => ({
                ...prev,
                [commentId]: data.comments || []
            }));
        } catch (error) {
            console.error("Error fetching replies:", error);
        }
    };

    const handleReply = (commentId, username) => {
        setReplyingToCommentId(commentId);
        setReplyingToUsername(username);
        // Only prefill if not already present
        if (!comment.startsWith(`@${username} `)) {
            setComment(`@${username} `);
        }
    };

    const addReply = async (parentCommentId) => {
        if (!replyText.trim() && !replyAttachment) return;

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            
            if (replyText.trim()) {
                formData.append("text", replyText.trim());
            }
            if (replyAttachment) {
                formData.append("file", replyAttachment);
            }
            formData.append("poll_id", postId);
            formData.append("parent_comment_id", parentCommentId);

            const response = await fetch(`${BASE_URL}/comment/add-comment`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to add reply");

            const data = await response.json();
            fetchReplies(parentCommentId);
            setReplyText("");
            setReplyAttachment(null);
            setReplyingToCommentId(null);
        } catch (error) {
            console.error("Error adding reply:", error);
        }
    };

    const handleReplyAttachment = (e) => {
        if (e.target.files && e.target.files[0]) {
            setReplyAttachment(e.target.files[0]);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    if (!post || !post.User) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white w-full max-w-6xl h-[95vh] rounded-2xl overflow-hidden shadow-xl flex">
                {/* Left: Post */}
                <div className="w-1/2 overflow-y-auto flex flex-col">
                    <div className="flex items-center gap-4 border-b p-4">
                        <img
                            src={`https://assets-stage.queryloom.com/${post.User.profile}`}
                            alt={`${post.User.name} profile`}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                            <div className="font-semibold text-gray-900">
                                {post.User.name}
                            </div>
                            <div className="text-sm text-gray-500">{post.User.username}</div>
                        </div>
                        <div className="ml-auto text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="text-lg font-medium whitespace-pre-line px-4 py-4 border-b">
                        {post.question}
                    </div>

                    {/* Poll options */}
                    {post.type === 'poll' && pollOptionsState.length > 0 && (
                        <div className="px-4 py-4 border-b">
                            <div className="space-y-2">
                                {pollOptionsState.map((option) => {
                                    const percent = pollOptionsState.reduce((sum, opt) => sum + (opt.votesCount || 0), 0) === 0 
                                        ? 0 
                                        : Math.round(((option.votesCount || 0) / pollOptionsState.reduce((sum, opt) => sum + (opt.votesCount || 0), 0)) * 100);
                                    const isSelected = selectedPollOption === option.id;

                                    return (
                                        <div
                                            key={option.id}
                                            className={`relative px-4 py-2 border rounded-xl text-sm flex justify-between items-center cursor-pointer overflow-hidden transition-all duration-200 ${
                                                isSelected ? 'border-pink-500' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: isSelected ? '#fff0f5' : 'white' }}
                                            onClick={() => handleVote(option.id)}
                                        >
                                            {/* Vote fill layer */}
                                            <div
                                                className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                                                    isSelected ? 'bg-pink-200' : 'bg-gray-100'
                                                }`}
                                                style={{
                                                    width: `${percent}%`,
                                                    zIndex: 0,
                                                }}
                                            />

                                            {/* Option Text and Percentage (Foreground) */}
                                            <div className="flex justify-between items-center w-full z-10">
                                                <span className="font-medium">{option.option}</span>
                                                <span className="font-semibold">{percent}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    
                    {post.attachments?.length > 0 && (
                        <div
                            className={`px-4 py-4 ${
                                post.attachments.length === 1
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

                {/* Right: Comments */}
                <div className="w-1/2 border-l flex flex-col justify-between no-scrollbar">
                    <div className="overflow-y-auto flex-grow max-h-[calc(95vh-120px)] no-scrollbar">
                        <div className="text-base font-semibold border-b p-4 flex items-center justify-between sticky top-0 bg-white z-10">
                            <span>All Comments</span>
                            <button
                                className="text-gray-500 hover:text-gray-700 transition"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4">
                            {(comments || []).map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-start gap-3 mb-4 bg-gray-100 rounded-xl p-3"
                                >
                                    <img
                                        src={
                                            c.User?.profile
                                                ? `https://assets-stage.queryloom.com/${c.User.profile}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                    c.User?.user_name || "User"
                                                )}`
                                        }
                                        alt={`${c.User?.user_name || "User"} profile`}
                                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm font-medium text-gray-900">
                                            <span>{c.User?.user_name || "Unknown"}</span>
                                            <span className="text-gray-400 whitespace-nowrap">
                                                {new Date(c.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {editingCommentId === c.id ? ( //Edit comment button
                                            <div className="flex flex-col">
                                                <textarea
                                                    className="w-full border rounded-xl p-2 text-sm resize-none"
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                />
                                                <div className="flex justify-end gap-2 mt-1">
                                                    <button
                                                        className="px-3 py-1 bg-green-200 text-green-700 rounded-lg hover:bg-green-300 transition"
                                                        onClick={() => handleEditComment(c.id)}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                                        onClick={() => setEditingCommentId(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {c.text && (
                                                    <p className="text-sm text-gray-700 mt-1">
                                                        {c.text}
                                                    </p>
                                                )}
                                                {c.attachment && (
                                                    <div className="mt-2">
                                                        {c.attachment.match(/\.(mp4|mov|webm)$/i) ? (
                                                            <video
                                                                src={`https://assets-stage.queryloom.com/${c.attachment}`}
                                                                controls
                                                                className="max-w-full rounded-lg"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={`https://assets-stage.queryloom.com/${c.attachment}`}
                                                                alt="Comment attachment"
                                                                className="max-w-full rounded-lg"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="flex gap-4 text-sm mt-2 text-gray-500">
                                            {/* Like Comment */}
                                            <button
                                                className={`flex items-center gap-1 transition ${likedComments.includes(c.id) ? "text-rose-500" : "text-gray-500"}  hover:text-rose-500`}
                                                onClick={() => handleLikeComment(c.id)}
                                                disabled={likeLoading[c.id]}
                                                aria-label="Like comment"
                                            >
                                                <ThumbsUp size={16} /> {c.likesCount}
                                            </button>
                                            {/* Dislike Comment */}
                                            <button
                                                className={`flex items-center gap-1 transition ${dislikedComments.includes(c.id) ? "text-blue-500" : "text-gray-500"}  hover:text-blue-500`}
                                                onClick={() => handleDislikeComment(c.id)}
                                                disabled={dislikeLoading[c.id]}
                                                aria-label="Dislike comment"
                                            >
                                                <ThumbsDown size={16} /> {c.dislikesCount}
                                            </button>
                                            {/* Show comment icon only if there are sub-comments */}
                                            {c.replyCount > 0 && (
                                                <button
                                                    className="hover:text-black flex items-center gap-1"
                                                    onClick={() => {
                                                        setShowReplies(prev => ({ ...prev, [c.id]: !prev[c.id] }));
                                                        if (!replies[c.id]) fetchReplies(c.id);
                                                    }}
                                                    aria-label="Show sub-comments"
                                                >
                                                    <MessageCircle size={16} /> {c.replyCount}
                                                </button>
                                            )}
                                            {/* Always show reply icon/button for starting a reply */}
                                            <button
                                                className="hover:text-black flex items-center gap-1"
                                                onClick={() => handleReply(c.id, c.User?.user_name || "User")}
                                                aria-label="Reply to comment"
                                            >
                                                ↩ Reply
                                            </button>
                                            {/*edit comment*/}
                                            {userData && userData.user_name === c.User?.user_name && (
                                                <button
                                                    className="hover:text-black flex items-center gap-1"
                                                    onClick={() => handleStartEdit(c.id, c.text)}
                                                    aria-label="Edit comment"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}
                                            {/*delete comment*/}
                                            {userData && userData.user_name === c.User?.user_name && (
                                                <button
                                                    className="hover:text-black flex items-center gap-1"
                                                    onClick={() => handleDeleteComment(c.id)}
                                                    aria-label="Delete comment"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Replies Display */}
                                        {showReplies[c.id] && replies[c.id] && (
                                            <div className="mt-3 ml-12 space-y-3">
                                                {replies[c.id].map((reply) => (
                                                    <div key={reply.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-2">
                                                        <img
                                                            src={
                                                                reply.User?.profile
                                                                    ? `https://assets-stage.queryloom.com/${reply.User.profile}`
                                                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                        reply.User?.user_name || "User"
                                                                    )}`
                                                            }
                                                            alt={`${reply.User?.user_name || "User"} profile`}
                                                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-sm font-medium text-gray-900">
                                                                <span>{reply.User?.user_name || "Unknown"}</span>
                                                                <span className="text-gray-400 whitespace-nowrap text-xs">
                                                                    {new Date(reply.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {reply.text && (
                                                                <p className="text-sm text-gray-700 mt-1">
                                                                    {reply.text}
                                                                </p>
                                                            )}
                                                            {reply.attachment && (
                                                                <div className="mt-2">
                                                                    {reply.attachment.match(/\.(mp4|mov|webm)$/i) ? (
                                                                        <video
                                                                            src={`https://assets-stage.queryloom.com/${reply.attachment}`}
                                                                            controls
                                                                            className="max-w-full rounded-lg"
                                                                        />
                                                                    ) : (
                                                                        <img
                                                                            src={`https://assets-stage.queryloom.com/${reply.attachment}`}
                                                                            alt="Reply attachment"
                                                                            className="max-w-full rounded-lg"
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Reply to sub-comment button */}
                                                            <div className="mt-1">
                                                                <button
                                                                    className="hover:text-black flex items-center gap-1 text-xs"
                                                                    onClick={() => handleReply(reply.id, reply.User?.user_name || "User")}
                                                                    aria-label="Reply to sub-comment"
                                                                >
                                                                    ↩ Reply
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comment Input */}
                    <div className="flex gap-3 p-4 border-t">
                        <img
                            src={userProfile}
                            alt="Your profile"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 mt-1"
                        />
                        <div className="flex-1 relative">
                            {replyingToCommentId && (
                                <div className="mb-1 text-xs text-pink-600 flex items-center gap-2">
                                    Replying to <b>@{replyingToUsername}</b>
                                    <button onClick={() => { setReplyingToCommentId(null); setReplyingToUsername(""); }} className="ml-2 text-gray-400 hover:text-gray-700">✕</button>
                                </div>
                            )}
                            <textarea
                                rows={4}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={replyingToCommentId ? "Write a reply..." : "Add your comment..."}
                                maxLength={300}
                                className="text-gray-500 w-full border rounded-xl p-3 pb-10 pr-28 text-sm resize-none outline-none border-gray-300 focus:ring-2 focus:ring-pink-500 transition bg-gray-100"
                            />
                            <div className="absolute bottom-4 left-3 flex gap-2 text-gray-500">
                                <label className="hover:text-black cursor-pointer">
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleCommentAttachment}
                                        accept="image/*,video/*"
                                    />
                                    <Paperclip size={20} />
                                </label>
                                <button className="hover:text-black">
                                    <Smile size={20} />
                                </button>
                            </div>
                            <div className="absolute bottom-4 right-3 text-xs flex justify-end items-center text-gray-400 gap-2">
                                <p className="pb-1">{comment.length} / 300</p>
                                <button
                                    className={`bg-gradient-to-br from-pink-500 to-orange-400 text-white p-2 rounded-lg transition ${
                                        !comment.trim() && !commentAttachment
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:scale-105"
                                    }`}
                                    onClick={addComment}
                                    disabled={!comment.trim() && !commentAttachment}
                                >
                                    <SendHorizontal size={18} />
                                </button>
                            </div>
                            {commentAttachment && (
                                <div className="mt-2 text-sm text-gray-700">
                                    Selected file: {commentAttachment.name}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostModal;