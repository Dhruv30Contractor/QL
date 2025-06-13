import React, { useEffect, useState, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { BASE_URL } from "../config";
import axios from "axios";

// Custom hook for managing comment state
const useCommentState = (postId) => {
    const [comments, setComments] = useState([]);
    const [replies, setReplies] = useState({});
    const [nestedReplies, setNestedReplies] = useState({});
    const [totalCommentCount, setTotalCommentCount] = useState(0);
    const [likedComments, setLikedComments] = useState([]);
    const [dislikedComments, setDislikedComments] = useState([]);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState("");
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [replyingToUsername, setReplyingToUsername] = useState("");

    // Memoized user data to prevent unnecessary re-renders
    const userData = useMemo(() => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }, []);

    // Fetch comments for the post
    const fetchComments = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${BASE_URL}/comment/fetch?poll_id=${postId}&parent_comment_id=&page=&limit=&action=comments&order=newest`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch comments");

            const data = await response.json();
            const comments = data.comments || [];
            setComments(comments);

            // Calculate total count including all replies
            let totalCount = comments.length;
            
            // Fetch replies for each comment to get accurate count
            const replyPromises = (comments || []).map(async (comment) => {
                if (comment.replyCount > 0) {
                    const replyResponse = await fetch(
                        `${BASE_URL}/comment/fetch?poll_id=${postId}&parent_comment_id=${comment.id}&page=1&limit=100&action=comments`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    
                    if (replyResponse.ok) {
                        const replyData = await replyResponse.json();
                        const replies = replyData.comments || [];
                        
                        // Update replies state
                        setReplies(prev => ({
                            ...prev,
                            [comment.id]: replies
                        }));

                        // Add replies count to total
                        totalCount += replies.length;

                        // Fetch nested replies for each reply
                        const nestedReplyPromises = (replies || []).map(async (reply) => {
                            if (reply.replyCount > 0) {
                                const nestedReplyResponse = await fetch(
                                    `${BASE_URL}/comment/fetch?poll_id=${postId}&parent_comment_id=${reply.id}&page=1&limit=100&action=comments`,
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    }
                                );
                                
                                if (nestedReplyResponse.ok) {
                                    const nestedReplyData = await nestedReplyResponse.json();
                                    const nestedReplies = nestedReplyData.comments || [];
                                    
                                    // Update nested replies state
                                    setNestedReplies(prev => ({
                                        ...prev,
                                        [reply.id]: nestedReplies
                                    }));

                                    // Add nested replies count to total
                                    totalCount += nestedReplies.length;
                                }
                            }
                        });

                        await Promise.all(nestedReplyPromises);
                    }
                }
            });

            await Promise.all(replyPromises);
            
            // Update total comment count
            setTotalCommentCount(totalCount);

            // Dispatch event to update comment count in PostCard
            const event = new CustomEvent('commentCountUpdate', {
                detail: {
                    postId: postId,
                    count: totalCount
                }
            });
            window.dispatchEvent(event);

        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    }, [postId]);

    // Fetch replies for a specific comment
    const fetchReplies = useCallback(async (commentId, page = 1, limit = 5) => {
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
            const newReplies = data.comments || [];
            
            // Update both replies and nestedReplies state
            setReplies(prev => ({
                ...prev,
                [commentId]: newReplies
            }));
            
            // Also update nestedReplies state for proper nested display
            setNestedReplies(prev => ({
                ...prev,
                [commentId]: newReplies
            }));
        } catch (error) {
            console.error("Error fetching replies:", error);
        }
    }, [postId]);

    // Add a new comment or reply
    const addComment = useCallback(async (text, attachment = null, parentId = null) => {
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            
            if (text.trim()) {
                formData.append("text", text.trim());
            }
            if (attachment) {
                formData.append("file", attachment);
            }
            formData.append("poll_id", postId);
            if (parentId) {
                formData.append("parent_comment_id", parentId);
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
            const newComment = {
                ...data.data,
                User: userData,
                likesCount: 0,
                dislikesCount: 0,
                replyCount: 0
            };

            if (parentId) {
                // Check if this is a reply to a reply (nested reply)
                const isNestedReply = Object.keys(replies).some(key => 
                    replies[key]?.some(reply => reply.id === parentId)
                );

                if (isNestedReply) {
                    // Find the top-level parent comment
                    const topLevelParentId = Object.keys(replies).find(key =>
                        replies[key]?.some(reply => reply.id === parentId)
                    );

                    if (topLevelParentId) {
                        // Update nested replies for the top-level parent
                        setNestedReplies(prev => ({
                            ...prev,
                            [topLevelParentId]: [...((prev[topLevelParentId]) || []), newComment]
                        }));

                        // Update reply count for the top-level parent comment
                        setComments(prev => (prev || []).map(c =>
                            c.id === topLevelParentId
                                ? { ...c, replyCount: (c.replyCount || 0) + 1 }
                                : c
                        ));
                    }
                }

                // Add as reply
                setReplies(prev => ({
                    ...prev,
                    [parentId]: [...((prev[parentId]) || []), newComment]
                }));

                // Update parent comment's reply count
                setComments(prev => (prev || []).map(c =>
                    c.id === parentId
                        ? { ...c, replyCount: (c.replyCount || 0) + 1 }
                        : c
                ));

                // Also update reply count in the replies state
                setReplies(prev => {
                    const updatedReplies = { ...prev };
                    Object.keys(updatedReplies).forEach(key => {
                        updatedReplies[key] = (updatedReplies[key] || []).map(reply =>
                            reply.id === parentId
                                ? { ...reply, replyCount: (reply.replyCount || 0) + 1 }
                                : reply
                        );
                    });
                    return updatedReplies;
                });

                // Update reply count in nested replies state
                setNestedReplies(prev => {
                    const updatedNestedReplies = { ...prev };
                    Object.keys(updatedNestedReplies).forEach(key => {
                        updatedNestedReplies[key] = (updatedNestedReplies[key] || []).map(reply =>
                            reply.id === parentId
                                ? { ...reply, replyCount: (reply.replyCount || 0) + 1 }
                                : reply
                        );
                    });
                    return updatedNestedReplies;
                });
            } else {
                // Add as main comment
                setComments(prev => [newComment, ...prev]);
            }

            setTotalCommentCount(prev => prev + 1);

            // Dispatch event to update comment count in PostCard
            const event = new CustomEvent('commentCountUpdate', {
                detail: {
                    postId: postId,
                    count: totalCommentCount + 1
                }
            });
            window.dispatchEvent(event);

            // Refresh comments to ensure all counts are up to date
            await fetchComments();
            return newComment;
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    }, [postId, userData, totalCommentCount, fetchComments, replies]);

    // Edit a comment or reply
    const editComment = useCallback(async (commentId, newText, isReply = false, parentId = null) => {
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("text", newText);
            if (isReply && parentId) {
                formData.append("parent_comment_id", parentId);
            }

            const response = await fetch(`${BASE_URL}/comment/edit/${commentId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to edit comment");

            if (isReply && parentId) {
                // Update reply
                setReplies(prev => ({
                    ...prev,
                    [parentId]: prev[parentId].map(c =>
                        c.id === commentId
                            ? { ...c, text: newText }
                            : c
                    )
                }));
                // Also update nestedReplies if it exists
                setNestedReplies(prev => ({
                    ...prev,
                    [parentId]: prev[parentId]?.map(c =>
                        c.id === commentId
                            ? { ...c, text: newText }
                            : c
                    )
                }));
            } else {
                // Update main comment
                setComments(prev => prev.map(c =>
                    c.id === commentId
                        ? { ...c, text: newText }
                        : c
                ));
            }

            // Refresh comments to ensure all counts are up to date
            await fetchComments();
        } catch (error) {
            console.error("Error editing comment:", error);
            throw error;
        }
    }, [fetchComments]);

    // Delete a comment or reply
    const deleteComment = useCallback(async (commentId, isReply = false, parentId = null) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BASE_URL}/comment/remove/${commentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete comment");

            if (isReply && parentId) {
                // Check if this is a reply to a reply (nested reply)
                const isNestedReply = Object.keys(replies).some(key => 
                    replies[key]?.some(reply => reply.id === commentId)
                );

                if (isNestedReply) {
                    // Find the top-level parent comment
                    const topLevelParentId = Object.keys(replies).find(key =>
                        replies[key]?.some(reply => reply.id === commentId)
                    );

                    if (topLevelParentId) {
                        // Update nested replies for the top-level parent
                        setNestedReplies(prev => {
                            const updatedNestedReplies = { ...prev };
                            // Remove the deleted reply from nested replies
                            if (updatedNestedReplies[topLevelParentId]) {
                                updatedNestedReplies[topLevelParentId] = updatedNestedReplies[topLevelParentId].filter(
                                    reply => reply.id !== commentId
                                );
                            }
                            return updatedNestedReplies;
                        });

                        // Update reply count for the top-level parent comment
                        setComments(prev => prev.map(c =>
                            c.id === topLevelParentId
                                ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) }
                                : c
                        ));

                        // Force refresh the nested replies for the top-level parent
                        const nestedReplyResponse = await fetch(
                            `${BASE_URL}/comment/fetch?poll_id=${postId}&parent_comment_id=${topLevelParentId}&page=1&limit=100&action=comments`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        if (nestedReplyResponse.ok) {
                            const nestedReplyData = await nestedReplyResponse.json();
                            const nestedReplies = nestedReplyData.comments || [];
                            
                            // Update nested replies state with fresh data
                            setNestedReplies(prev => ({
                                ...prev,
                                [topLevelParentId]: nestedReplies
                            }));
                        }
                    }
                }

                // Remove from replies
                setReplies(prev => {
                    const updatedReplies = { ...prev };
                    // Remove the deleted reply from replies
                    if (updatedReplies[parentId]) {
                        updatedReplies[parentId] = updatedReplies[parentId].filter(
                            reply => reply.id !== commentId
                        );
                    }
                    return updatedReplies;
                });

                // Update parent comment's reply count
                setComments(prev => prev.map(c =>
                    c.id === parentId
                        ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) }
                        : c
                ));

                // Update reply count in the replies state
                setReplies(prev => {
                    const updatedReplies = { ...prev };
                    Object.keys(updatedReplies).forEach(key => {
                        updatedReplies[key] = updatedReplies[key].map(reply =>
                            reply.id === parentId
                                ? { ...reply, replyCount: Math.max(0, (reply.replyCount || 0) - 1) }
                                : reply
                        );
                    });
                    return updatedReplies;
                });

                // Update reply count in nested replies state
                setNestedReplies(prev => {
                    const updatedNestedReplies = { ...prev };
                    Object.keys(updatedNestedReplies).forEach(key => {
                        updatedNestedReplies[key] = updatedNestedReplies[key].map(reply =>
                            reply.id === parentId
                                ? { ...reply, replyCount: Math.max(0, (reply.replyCount || 0) - 1) }
                                : reply
                        );
                    });
                    return updatedNestedReplies;
                });
            } else {
                // Remove main comment
                setComments(prev => prev.filter(c => c.id !== commentId));
            }

            // Calculate new total count immediately
            let newTotalCount = 0;
            
            // Count main comments
            const mainComments = comments.filter(c => c.id !== commentId);
            newTotalCount += mainComments.length;

            // Count replies
            Object.values(replies).forEach(replyList => {
                newTotalCount += replyList.filter(r => r.id !== commentId).length;
            });

            // Count nested replies
            Object.values(nestedReplies).forEach(nestedReplyList => {
                newTotalCount += nestedReplyList.filter(r => r.id !== commentId).length;
            });

            // Update total count
            setTotalCommentCount(newTotalCount);

            // Dispatch event with the new count immediately
            const event = new CustomEvent('commentCountUpdate', {
                detail: {
                    postId: postId,
                    count: newTotalCount
                }
            });
            window.dispatchEvent(event);

            // Then refresh comments to ensure everything is in sync
            await fetchComments();

        } catch (error) {
            console.error("Error deleting comment:", error);
            throw error;
        }
    }, [postId, comments, replies, nestedReplies]);

    // Like/Unlike a comment
    const toggleLike = useCallback(async (commentId, isReply = false, parentId = null) => {
        try {
            const token = localStorage.getItem("token");
            const isLiked = likedComments.includes(commentId);
            const wasDisliked = dislikedComments.includes(commentId);

            const response = await fetch(`${BASE_URL}/likes/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    comment_id: commentId,
                    del: isLiked ? 1 : 0,
                    dislike: 0,
                    poll_id: postId,
                }),
            });

            if (!response.ok) throw new Error("Failed to like/unlike comment");

            // Update state
            if (isReply && parentId) {
                setReplies(prev => ({
                    ...prev,
                    [parentId]: prev[parentId].map(c =>
                        c.id === commentId
                            ? {
                                ...c,
                                likesCount: isLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0) + 1,
                                dislikesCount: wasDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : (c.dislikesCount || 0),
                            }
                            : c
                    )
                }));
            } else {
                setComments(prev => prev.map(c =>
                    c.id === commentId
                        ? {
                            ...c,
                            likesCount: isLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0) + 1,
                            dislikesCount: wasDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : (c.dislikesCount || 0),
                        }
                        : c
                ));
            }

            // Update liked/disliked arrays
            setLikedComments(prev =>
                isLiked ? prev.filter(id => id !== commentId) : [...prev, commentId]
            );
            setDislikedComments(prev => prev.filter(id => id !== commentId));
        } catch (error) {
            console.error("Error toggling like:", error);
            throw error;
        }
    }, [postId, likedComments, dislikedComments]);

    // Dislike/Undislike a comment
    const toggleDislike = useCallback(async (commentId, isReply = false, parentId = null) => {
        try {
            const token = localStorage.getItem("token");
            const isDisliked = dislikedComments.includes(commentId);
            const wasLiked = likedComments.includes(commentId);

            const response = await fetch(`${BASE_URL}/likes/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    comment_id: commentId,
                    del: isDisliked ? 1 : 0,
                    dislike: 1,
                    poll_id: postId,
                }),
            });

            if (!response.ok) throw new Error("Failed to dislike/undislike comment");

            // Update state
            if (isReply && parentId) {
                setReplies(prev => ({
                    ...prev,
                    [parentId]: [...prev[parentId].map(c =>
                        c.id === commentId
                            ? {
                                ...c,
                                dislikesCount: isDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : (c.dislikesCount || 0) + 1,
                                likesCount: wasLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0),
                            }
                            : c
                    )]
                }));
            } else {
                setComments(prev => prev.map(c =>
                    c.id === commentId
                        ? {
                            ...c,
                            dislikesCount: isDisliked ? Math.max(0, (c.dislikesCount || 0) - 1) : (c.dislikesCount || 0) + 1,
                            likesCount: wasLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0),
                        }
                        : c
                ));
            }

            // Update liked/disliked arrays
            setDislikedComments(prev =>
                isDisliked ? prev.filter(id => id !== commentId) : [...prev, commentId]
            );
            setLikedComments(prev => prev.filter(id => id !== commentId));
        } catch (error) {
            console.error("Error toggling dislike:", error);
            throw error;
        }
    }, [postId, likedComments, dislikedComments]);

    return {
        comments,
        replies,
        nestedReplies,
        totalCommentCount,
        likedComments,
        dislikedComments,
        editingCommentId,
        editText,
        replyingToCommentId,
        replyingToUsername,
        userData,
        setEditingCommentId,
        setEditText,
        setReplyingToCommentId,
        setReplyingToUsername,
        fetchComments,
        fetchReplies,
        addComment,
        editComment,
        deleteComment,
        toggleLike,
        toggleDislike,
    };
};

// Recursive component for rendering nested replies
const NestedReplies = React.memo(({ replies, parentId, level = 0, onReply, onEdit, onDelete, onLike, onDislike, editingCommentId, editText, setEditText, handleEditSubmit, likedComments, dislikedComments, userData, showNestedReplies, setShowNestedReplies, fetchReplies, nestedReplies, setEditingCommentId }) => {
    if (level >= 2) return null;

    // Function to get profile image URL
    const getProfileImageUrl = (user) => {
        return user?.profile
            ? `https://assets-stage.queryloom.com/${user.profile}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.user_name || "User"
            )}`;
    };

    return replies.map((reply) => {
        const hasInteractions = (reply.likesCount > 0 || reply.dislikesCount > 0 || reply.replyCount > 0);
        const isEditing = editingCommentId === reply.id;
        const canEdit = userData?.user_name === reply.User?.user_name && !hasInteractions;

        return (
            <div key={reply.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-2">
                <img
                    src={getProfileImageUrl(reply.User)}
                    alt={`${reply.User?.user_name || "User"} profile`}
                    className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1">
                    <div className="flex justify-between text-sm font-medium text-gray-900">
                        <span>{reply.User?.user_name || "Unknown"}</span>
                        <span className="text-gray-400 whitespace-nowrap text-xs">
                            {new Date(reply.createdAt).toLocaleString()}
                        </span>
                    </div>
                    {isEditing ? (
                        <div className="mt-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full border rounded-lg p-2 text-sm resize-none outline-none border-gray-300 focus:ring-2 focus:ring-pink-500 transition"
                                rows={3}
                                maxLength={300}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => {
                                        setEditingCommentId(null);
                                        setEditText("");
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleEditSubmit(reply.id, true, parentId)}
                                    className="text-sm bg-pink-500 text-white px-3 py-1 rounded-lg hover:bg-pink-600"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                    <div className="flex gap-4 text-sm mt-2 text-gray-500">
                        <button
                            className={`flex items-center gap-1 transition ${likedComments.includes(reply.id) ? "text-rose-500" : "text-gray-500"} hover:text-rose-500`}
                            onClick={() => onLike(reply.id, true, parentId)}
                            aria-label="Like reply"
                        >
                            <ThumbsUp size={16} /> {reply.likesCount || 0}
                        </button>
                        <button
                            className={`flex items-center gap-1 transition ${dislikedComments.includes(reply.id) ? "text-blue-500" : "text-gray-500"} hover:text-blue-500`}
                            onClick={() => onDislike(reply.id, true, parentId)}
                            aria-label="Dislike reply"
                        >
                            <ThumbsDown size={16} /> {reply.dislikesCount || 0}
                        </button>
                        {/* Show reply count button if there are replies */}
                        {(reply.replyCount > 0 || (nestedReplies[reply.id] && nestedReplies[reply.id].length > 0)) && level < 1 && (
                            <button
                                className="hover:text-black flex items-center gap-1"
                                onClick={() => {
                                    setShowNestedReplies(prev => ({ ...prev, [reply.id]: !prev[reply.id] }));
                                    if (!nestedReplies[reply.id]) {
                                        fetchReplies(reply.id);
                                    }
                                }}
                                aria-label="Show nested replies"
                            >
                                <MessageCircle size={16} /> {reply.replyCount || (nestedReplies[reply.id]?.length || 0)}
                            </button>
                        )}
                        {/* Show reply button only if we haven't reached the maximum nesting level */}
                        {level < 1 && (
                            <button
                                className="hover:text-black flex items-center gap-1 text-xs"
                                onClick={() => onReply(reply.id, reply.User?.user_name || "User")}
                                aria-label="Reply to sub-comment"
                            >
                                ↩ Reply
                            </button>
                        )}
                        {/* Show edit button if user is the author and there are no replies */}
                        {userData?.user_name === reply.User?.user_name && 
                         (!reply.replyCount || reply.replyCount === 0) && 
                         (!nestedReplies[reply.id] || nestedReplies[reply.id].length === 0) && (
                            <button
                                className="hover:text-black flex items-center gap-1"
                                onClick={() => onEdit(reply.id, reply.text)}
                                aria-label="Edit reply"
                            >
                                <Edit size={16} />
                            </button>
                        )}
                        {userData?.user_name === reply.User?.user_name && (
                            <button
                                className="hover:text-black flex items-center gap-1"
                                onClick={() => onDelete(reply.id, true, parentId)}
                                aria-label="Delete reply"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    {showNestedReplies[reply.id] && (nestedReplies[reply.id] || replies[reply.id]) && level < 1 && (
                        <div className="mt-3 ml-8 space-y-3">
                            <NestedReplies 
                                replies={nestedReplies[reply.id] || replies[reply.id]} 
                                parentId={reply.id}
                                level={level + 1}
                                onReply={onReply}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onLike={onLike}
                                onDislike={onDislike}
                                editingCommentId={editingCommentId}
                                editText={editText}
                                setEditText={setEditText}
                                handleEditSubmit={handleEditSubmit}
                                likedComments={likedComments}
                                dislikedComments={dislikedComments}
                                userData={userData}
                                showNestedReplies={showNestedReplies}
                                setShowNestedReplies={setShowNestedReplies}
                                fetchReplies={fetchReplies}
                                nestedReplies={nestedReplies}
                                setEditingCommentId={setEditingCommentId}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    });
}, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
        prevProps.replies === nextProps.replies &&
        prevProps.parentId === nextProps.parentId &&
        prevProps.level === nextProps.level &&
        prevProps.editingCommentId === nextProps.editingCommentId &&
        prevProps.editText === nextProps.editText &&
        prevProps.likedComments === nextProps.likedComments &&
        prevProps.dislikedComments === nextProps.dislikedComments &&
        prevProps.showNestedReplies === nextProps.showNestedReplies &&
        prevProps.nestedReplies === nextProps.nestedReplies
    );
});

// Main PostModal component
const PostModal = ({ postId, onClose }) => {
    // State for post data
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [commentAttachment, setCommentAttachment] = useState(null);
    const [showReplies, setShowReplies] = useState({});
    const [showNestedReplies, setShowNestedReplies] = useState({});


    
    // Use our custom hook for comment state management
    const {
        comments,
        replies,
        nestedReplies,
        totalCommentCount,
        likedComments,
        dislikedComments,
        editingCommentId,
        editText,
        replyingToCommentId,
        replyingToUsername,
        userData,
        setEditingCommentId,
        setEditText,
        setReplyingToCommentId,
        setReplyingToUsername,
        fetchComments,
        fetchReplies,
        addComment,
        editComment,
        deleteComment,
        toggleLike,
        toggleDislike,
    } = useCommentState(postId);

    // Fetch post data
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
            } catch (error) {
                console.error("Error fetching post data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
        fetchComments();
    }, [postId]);

    // Handle comment submission
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim() && !commentAttachment) return;

        try {
            await addComment(comment, commentAttachment, replyingToCommentId);
            setComment("");
            setCommentAttachment(null);
            setReplyingToCommentId(null);
            setReplyingToUsername("");
        } catch (error) {
            alert("Failed to add comment. Please try again.");
        }
    };

    // Handle reply to comment
    const handleReply = (commentId, username) => {
        setReplyingToCommentId(commentId);
        setReplyingToUsername(username);
        setShowReplies(prev => ({ ...prev, [commentId]: true }));
        setShowNestedReplies(prev => ({ ...prev, [commentId]: true }));
        // Add username to comment input
        setComment(`@${username} `);
    };

    // Handle start editing
    const handleStartEdit = (commentId, text) => {
        setEditingCommentId(commentId);
        setEditText(text);
    };

    // Handle edit submission
    const handleEditSubmit = async (commentId, isReply = false, parentId = null) => {
        try {
            await editComment(commentId, editText, isReply, parentId);
            setEditingCommentId(null);
            setEditText("");
        } catch (error) {
            alert("Failed to edit comment. Please try again.");
        }
    };

    // Handle delete
    const handleDelete = async (commentId, isReply = false, parentId = null) => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            try {
                await deleteComment(commentId, isReply, parentId);
            } catch (error) {
                alert("Failed to delete comment. Please try again.");
            }
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
                {/* Left: Post Content */}
                <div className="w-1/2 overflow-y-auto flex flex-col">
                    <div className="flex items-center gap-4 border-b p-4">
                        <img
                            src={
                                post.User.profile
                                    ? `https://assets-stage.queryloom.com/${post.User.profile}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        post.User.name || "User"
                                    )}`
                            }
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

                {/* Right: Comments Section */}
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
                            {comments.map((c) => {
                                const hasInteractions = (c.likesCount > 0 || c.dislikesCount > 0 || c.replyCount > 0);
                                const isEditing = editingCommentId === c.id;
                                const canEdit = userData?.user_name === c.User?.user_name && !hasInteractions;

                                return (
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
                                            {isEditing ? (
                                                <div className="mt-2">
                                                    <textarea
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="w-full border rounded-lg p-2 text-sm resize-none outline-none border-gray-300 focus:ring-2 focus:ring-pink-500 transition"
                                                        rows={3}
                                                        maxLength={300}
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingCommentId(null);
                                                                setEditText("");
                                                            }}
                                                            className="text-sm text-gray-500 hover:text-gray-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditSubmit(c.id)}
                                                            className="text-sm bg-pink-500 text-white px-3 py-1 rounded-lg hover:bg-pink-600"
                                                        >
                                                            Save
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
                                                <button
                                                    className={`flex items-center gap-1 transition ${likedComments.includes(c.id) ? "text-rose-500" : "text-gray-500"} hover:text-rose-500`}
                                                    onClick={() => toggleLike(c.id)}
                                                    aria-label="Like comment"
                                                >
                                                    <ThumbsUp size={16} /> {c.likesCount || 0}
                                                </button>
                                                <button
                                                    className={`flex items-center gap-1 transition ${dislikedComments.includes(c.id) ? "text-blue-500" : "text-gray-500"} hover:text-blue-500`}
                                                    onClick={() => toggleDislike(c.id)}
                                                    aria-label="Dislike comment"
                                                >
                                                    <ThumbsDown size={16} /> {c.dislikesCount || 0}
                                                </button>
                                                {c.replyCount > 0 && (
                                                    <button
                                                        className="hover:text-black flex items-center gap-1"
                                                        onClick={() => {
                                                            setShowReplies(prev => ({ ...prev, [c.id]: !prev[c.id] }));
                                                            if (!replies[c.id]) fetchReplies(c.id);
                                                        }
                                                    }
                                                        aria-label="Show replies"
                                                    >
                                                        <MessageCircle size={16} /> {c.replyCount}
                                                    </button>
                                                )}
                                                <button
                                                    className="hover:text-black flex items-center gap-1"
                                                    onClick={() => handleReply(c.id, c.User?.user_name || "User")}
                                                    aria-label="Reply to comment"
                                                >
                                                    ↩ Reply
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        className="hover:text-black flex items-center gap-1"
                                                        onClick={() => handleStartEdit(c.id, c.text)}
                                                        aria-label="Edit comment"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {userData?.user_name === c.User?.user_name && (
                                                    <button
                                                        className="hover:text-black flex items-center gap-1"
                                                        onClick={() => handleDelete(c.id)}
                                                        aria-label="Delete comment"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {showReplies[c.id] && replies[c.id] && (
                                                <div className="mt-3 ml-12 space-y-3" key={`reply-${c.id}-${replies[c.id]?.length}`}>
                                                    <NestedReplies 
                                                        replies={replies[c.id]} 
                                                        parentId={c.id}
                                                        onReply={handleReply}
                                                        onEdit={handleStartEdit}
                                                        onDelete={handleDelete}
                                                        onLike={toggleLike}
                                                        onDislike={toggleDislike}
                                                        editingCommentId={editingCommentId}
                                                        editText={editText}
                                                        setEditText={setEditText}
                                                        handleEditSubmit={handleEditSubmit}
                                                        likedComments={likedComments}
                                                        dislikedComments={dislikedComments}
                                                        userData={userData}
                                                        showNestedReplies={showNestedReplies}
                                                        setShowNestedReplies={setShowNestedReplies}
                                                        fetchReplies={fetchReplies}
                                                        nestedReplies={nestedReplies}
                                                        setEditingCommentId={setEditingCommentId}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Comment Input */}
                    <div className="flex gap-3 p-4 border-t">
                        <img
                            src={
                                userData?.profile
                                    ? `https://assets-stage.queryloom.com/${userData.profile}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        userData?.name || "User"
                                    )}`
                            }
                            alt="Your profile"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 mt-1"
                        />
                        <div className="flex-1 relative">
                            {replyingToCommentId && (
                                <div className="mb-1 text-xs text-pink-600 flex items-center gap-2">
                                    Replying to <b>@{replyingToUsername}</b>
                                    <button 
                                        onClick={() => {
                                            setReplyingToCommentId(null);
                                            setReplyingToUsername("");
                                        }} 
                                        className="ml-2 text-gray-400 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
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
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setCommentAttachment(e.target.files[0]);
                                            }
                                        }}
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
                                    onClick={handleAddComment}
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