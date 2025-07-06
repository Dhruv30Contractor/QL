import React, { useEffect, useState, useMemo, useRef } from "react";
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
import InfiniteScroll from 'react-infinite-scroll-component';

const PostModal = ({ postId, onClose }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState([]);
  const [replies, setReplies] = useState({});
  const [nestedReplies, setNestedReplies] = useState({});
  const [totalCommentCount, setTotalCommentCount] = useState(0);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");

  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyingToUsername, setReplyingToUsername] = useState("");

  const [comment, setComment] = useState("");
  const [commentAttachment, setCommentAttachment] = useState(null);

  const [showReplies, setShowReplies] = useState({});
  const [showNestedReplies, setShowNestedReplies] = useState({});

  const [loadingReplies, setLoadingReplies] = useState({});
  const [loadingNestedReplies, setLoadingNestedReplies] = useState({});

  const [editAttachment, setEditAttachment] = useState(null);
  const [attachmentToRemove, setAttachmentToRemove] = useState(null);

  const textareaRef = useRef(null);
  const commentAttachmentInputRef = useRef(null);
  const editAttachmentInputRef = useRef(null);

  const userData = useMemo(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }, []);

  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  const [replyPages, setReplyPages] = useState({});
  const [hasMoreReplies, setHasMoreReplies] = useState({});
  const [nestedReplyPages, setNestedReplyPages] = useState({});
  const [hasMoreNestedReplies, setHasMoreNestedReplies] = useState({});

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

    setCommentPage(1);
    setHasMoreComments(true);
    fetchPost();
    fetchComments(1);
  }, [postId]);

  const fetchComments = async (page = 1, limit = 10, append = false) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/comment/fetch?poll_id=${postId}&parent_comment_id=&page=${page}&limit=${limit}&action=comments&order=newest`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch comments");

      const data = await response.json();
      const mainComments = data.comments || [];
      if (page === 1 && !append) {
        setComments(mainComments);
      } else if (append) {
        setComments((prev) => [...prev, ...mainComments]);
      } else {
        setComments((prev) => [...prev, ...mainComments]);
      }

      // Use backend comment_count if available
      const backendTotal = data.comment_count || data.totalCount || data.totalComments;
      let totalCount;
      if (typeof backendTotal === 'number') {
        totalCount = backendTotal;
      } else {
        totalCount = (page === 1 ? mainComments.length : comments.length + mainComments.length);
        mainComments.forEach((comment) => {
          totalCount += comment.replyCount || 0;
        });
      }

      setTotalCommentCount(totalCount);
      setHasMoreComments(mainComments.length === limit);

      window.dispatchEvent(
        new CustomEvent("commentCountUpdate", {
          detail: { postId, count: totalCount },
        })
      );
      return mainComments;
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  };

  const fetchReplies = async (commentId, page = 1, limit = 5, append = false) => {
    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
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
      const replyList = data.comments || [];

      setReplies((prev) => ({
        ...prev,
        [commentId]: page === 1 ? replyList : [...(prev[commentId] || []), ...replyList],
      }));

      if (!(append && limit === 1)) {
        setReplyPages((prev) => ({ ...prev, [commentId]: page }));
      }

      setHasMoreReplies((prev) => ({ ...prev, [commentId]: replyList.length === limit }));
    } catch (error) {
      console.error("Error fetching replies:", error);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const fetchNestedReplies = async (replyId, page = 1, limit = 3, append = false) => {
    setLoadingNestedReplies((prev) => ({ ...prev, [replyId]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/comment/fetch?poll_id=${postId}&parent_comment_id=${replyId}&page=${page}&limit=${limit}&action=comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch nested replies");

      const data = await response.json();
      const nestedReplyList = data.comments || [];

      setNestedReplies((prev) => ({
        ...prev,
        [replyId]: page === 1 ? nestedReplyList : [...(prev[replyId] || []), ...nestedReplyList],
      }));

      if (!(append && limit === 1)) {
        setNestedReplyPages((prev) => ({ ...prev, [replyId]: page }));
      }

      setHasMoreNestedReplies((prev) => ({ ...prev, [replyId]: nestedReplyList.length === limit }));
    } catch (error) {
      console.error("Error fetching nested replies:", error);
    } finally {
      setLoadingNestedReplies((prev) => ({ ...prev, [replyId]: false }));
    }
  };

  const addComment = async (text, attachment = null, parentId = null) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      if (text.trim()) formData.append("text", text.trim());
      if (attachment) formData.append("file", attachment);
      formData.append("poll_id", postId);
      if (parentId) formData.append("parent_comment_id", parentId);

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
        replyCount: 0,
        userLike: false,
        userDislike: false,
      };

      if (parentId) {
        const isParentAReply = Object.keys(replies).some((key) =>
          replies[key]?.some((r) => r.id === parentId)
        );

        if (isParentAReply) {
          const topCommentId = Object.keys(replies).find((key) =>
            replies[key]?.some((r) => r.id === parentId)
          );

          setNestedReplies((prev) => ({
            ...prev,
            [parentId]: [...(prev[parentId] || []), newComment],
          }));

          if (topCommentId) {
            setReplies((prev) => ({
              ...prev,
              [topCommentId]: prev[topCommentId]?.map((r) =>
                r.id === parentId
                  ? { ...r, replyCount: (r.replyCount || 0) + 1 }
                  : r
              ),
            }));
            setComments((prev) =>
              prev.map((c) =>
                c.id === parseInt(topCommentId)
                  ? { ...c, replyCount: (c.replyCount || 0) + 1 }
                  : c
              )
            );
          }
        } else {
          setReplies((prev) => ({
            ...prev,
            [parentId]: [...(prev[parentId] || []), newComment],
          }));
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replyCount: (c.replyCount || 0) + 1 }
                : c
            )
          );
        }
      } else {
        setComments((prev) => [newComment, ...prev]);
      }

      setTotalCommentCount((prev) => prev + 1);
      window.dispatchEvent(
        new CustomEvent("commentCountUpdate", {
          detail: { postId, count: totalCommentCount + 1 },
        })
      );

      return newComment;
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const editComment = async (
    commentId,
    newText,
    isReply = false,
    parentId = null
  ) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("text", newText);
      if (isReply && parentId) formData.append("parent_comment_id", parentId);
      if (editAttachment) {
        formData.append("file", editAttachment);
      } else if (attachmentToRemove) {
        formData.append("rmv_attach", 1);
      }

      const response = await fetch(`${BASE_URL}/comment/edit/${commentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error("Failed to edit comment");

      const updateComment = (comment) => ({
        ...comment,
        text: newText,
        attachment: attachmentToRemove
          ? null
          : editAttachment
          ? data.data?.attachment || comment.attachment
          : comment.attachment,
      });

      if (isReply && parentId) {
        const isNested = Object.keys(nestedReplies).some((key) =>
          nestedReplies[key]?.some((nr) => nr.id === commentId)
        );

        if (isNested) {
          const replyId = Object.entries(nestedReplies).forEach(
            ([parentReplyId, replies]) => {
              if (replies.some((r) => r.id === commentId)) {
                setNestedReplies((prev) => ({
                  ...prev,
                  [parentReplyId]: prev[parentReplyId].map((r) =>
                    r.id === commentId ? updateComment(r) : r
                  ),
                }));
              }
            }
          );

          if (replyId) {
            setNestedReplies((prev) => {
              const updatedList = (prev[replyId] || []).map((nr) =>
                nr.id === commentId ? updateComment(nr) : nr
              );

              return {
                ...prev,
                [replyId]: updatedList,
              };
            });
          }
        } else {
          const mainCommentId = Object.keys(replies).find((key) =>
            replies[key]?.some((r) => r.id === commentId)
          );

          if (mainCommentId) {
            setReplies((prev) => {
              const updated = (prev[mainCommentId] || []).map((r) =>
                r.id === commentId ? updateComment(r) : r
              );

              return {
                ...prev,
                [mainCommentId]: updated,
              };
            });
          }
        }
      } else {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updateComment(c) : c))
        );
      }
      if (editAttachment) {
        comment.attachment = `https://assets-stage.queryloom.com/${editAttachment.name}`;
      }

      //   await fetchComments();
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };
  // console.log("Comment PAGES:", replyPages);

  //   console.log("Comment PAGES:", commentPage);

  const deleteComment = async (commentId, isReply = false, parentId = null) => {
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
        const isNested = Object.keys(nestedReplies).some((key) =>
          nestedReplies[key]?.some((nr) => nr.id === commentId)
        );

        if (isNested) {
          setNestedReplies((prev) => ({
            ...prev,
            [parentId]: prev[parentId]?.filter((r) => r.id !== commentId),
          }));

          const topCommentId = Object.keys(replies).find((key) =>
            replies[key]?.some((r) => r.id === parentId)
          );

          if (topCommentId) {
            setReplies((prev) => ({
              ...prev,
              [topCommentId]: prev[topCommentId]?.map((r) =>
                r.id === parentId
                  ? { ...r, replyCount: Math.max(0, (r.replyCount || 0) - 1) }
                  : r
              ),
            }));
            setComments((prev) =>
              prev.map((c) =>
                c.id === parseInt(topCommentId)
                  ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) }
                  : c
              )
            );
          }
          // Append one more nested reply
          setTimeout(async () => {
            const limit = 3;
            
            const updatedNested = (nestedReplies[parentId]?.filter((r) => r.id !== commentId) || []);
            if (updatedNested.length < limit && hasMoreNestedReplies[parentId]) {
              const currentPage = nestedReplyPages[parentId] || 1;
              const fetchPage = (currentPage * limit);
              await fetchNestedReplies(parentId, fetchPage, 1, true);
            }
          }, 1000);
        } else {
          setReplies((prev) => ({
            ...prev,
            [parentId]: prev[parentId]?.filter((r) => r.id !== commentId),
          }));
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) }
                : c
            )
          );
          // Append one more reply
          setTimeout(async () => {
            const limit = 5;
            
            const updatedReplies = (replies[parentId]?.filter((r) => r.id !== commentId) || []);

            if (updatedReplies.length < limit && hasMoreReplies[parentId]) {
              const currentPage = replyPages[parentId] || 1;
              const fetchPage = (currentPage * limit);
              await fetchReplies(parentId, fetchPage, 1, true);
            }
          }, 1000);
        }
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        // Fetch one more comment if needed
        setTimeout(async () => {
          const limit = 10;
          if (comments.length - 1 < limit && hasMoreComments) {
            const currentPage = commentPage || 1;
            const fetchPage = (currentPage * limit);
            await fetchComments(fetchPage, 1, true);
          }
        }, 1000);
      }

      setTotalCommentCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(
        new CustomEvent("commentCountUpdate", {
          detail: { postId, count: totalCommentCount - 1 },
        })
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleLikeDislike = async (
    comment,
    action,
    isReply = false,
    parentId = null
  ) => {
    try {
      const token = localStorage.getItem("token");

      let dislike = action === "dislike" ? 1 : 0;
      let del =
        (action === "like" && comment.userLike) ||
        (action === "dislike" && comment.userDislike)
          ? 1
          : 0;

      const response = await fetch(`${BASE_URL}/likes/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poll_id: postId,
          comment_id: comment.id,
          dislike,
          del,
        }),
      });

      if (!response.ok) throw new Error("Failed to update like/dislike");

      const updateReaction = (c) => {
        const wasLiked = c.userLike;
        const wasDisliked = c.userDislike;

        return {
          ...c,
          userLike: action === "like" ? !wasLiked : false,
          userDislike: action === "dislike" ? !wasDisliked : false,
          likesCount:
            action === "like"
              ? wasLiked
                ? c.likesCount - 1
                : c.likesCount + 1
              : wasDisliked
              ? c.likesCount
              : wasLiked
              ? c.likesCount - 1
              : c.likesCount,
          dislikesCount:
            action === "dislike"
              ? wasDisliked
                ? c.dislikesCount - 1
                : c.dislikesCount + 1
              : wasLiked
              ? c.dislikesCount
              : wasDisliked
              ? c.dislikesCount - 1
              : c.dislikesCount,
        };
      };

      if (isReply && parentId) {
        const isNested = Object.entries(nestedReplies).some(
          ([key, list]) =>
            Array.isArray(list) && list.some((r) => r.id === comment.id)
        );

        if (isNested) {
          const ownerId = Object.keys(nestedReplies).find(
            (key) =>
              Array.isArray(nestedReplies[key]) &&
              nestedReplies[key].some((nr) => nr.id === comment.id)
          );

          if (ownerId) {
            setNestedReplies((prev) => ({
              ...prev,
              [ownerId]: (prev[ownerId] || []).map((nr) =>
                nr.id === comment.id ? updateReaction(nr) : nr
              ),
            }));
          }
        } else {
          setReplies((prev) => ({
            ...prev,
            [parentId]: (prev[parentId] || []).map((r) =>
              r.id === comment.id ? updateReaction(r) : r
            ),
          }));
        }
      } else {
        setComments((prev) =>
          prev.map((c) => (c.id === comment.id ? updateReaction(c) : c))
        );
      }
    } catch (err) {
      console.error("Like/Dislike failed:", err);
    }
  };

  const handleReply = (commentId, username) => {
    setReplyingToCommentId(commentId);
    setReplyingToUsername(username);
    setShowReplies((prev) => ({ ...prev, [commentId]: true }));
    setShowNestedReplies((prev) => ({ ...prev, [commentId]: true }));
    setComment(`@${username} `);

    if (textareaRef.current) {
      const cursorPosition = username.length + 2;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  };

  const handleStartEdit = (commentId, text) => {
    setEditingCommentId(commentId);
    setEditText(text);
  };

  const handleEditSubmit = async (
    commentId,
    isReply = false,
    parentId = null
  ) => {
    try {
      await editComment(commentId, editText, isReply, parentId);
      setEditingCommentId(null);
      setEditText("");
      setEditAttachment(null);
      setAttachmentToRemove(null);
      fetchReplies(parentId || commentId);

      if (editAttachmentInputRef.current) {
        editAttachmentInputRef.current.value = null;
      }
    } catch (error) {
      alert("Failed to edit comment. Please try again.");
    }
  };

  const handleDelete = async (commentId, isReply = false, parentId = null) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment(commentId, isReply, parentId);
      } catch (error) {
        alert("Failed to delete comment. Please try again.");
      }
    }
  };

  const handleAddComment = async (e, parentId = null) => {
    e.preventDefault();
    if (!comment.trim() && !commentAttachment) return;

    try {
      await addComment(comment, commentAttachment, replyingToCommentId);
      setComment("");
      setCommentAttachment(null);
      setReplyingToCommentId(null);
      setReplyingToUsername("");

      if (commentAttachmentInputRef.current) {
        commentAttachmentInputRef.current.value = null;
      }

      if (replyingToCommentId) {
        const isReplyToReply = Object.keys(replies).some((key) =>
          replies[key]?.some((r) => r.id === replyingToCommentId)
        );

        if (isReplyToReply) {
          await fetchNestedReplies(replyingToCommentId);
        } else {
          await fetchReplies(replyingToCommentId);
        }
      }
    } catch (error) {
      alert("Failed to add comment. Please try again.");
    }
  };

  const loadMoreComments = () => {
    const nextPage = commentPage + 1;
    setCommentPage(nextPage);
    fetchComments(nextPage);
  };

  const loadMoreReplies = (commentId) => {
    const nextPage = (replyPages[commentId] || 1) + 1;
    fetchReplies(commentId, nextPage);
  };

  const loadMoreNestedReplies = (replyId) => {
    const nextPage = (nestedReplyPages[replyId] || 1) + 1;
    fetchNestedReplies(replyId, nextPage);
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
          {/* Comments List */}
          <div
            id="comments-scrollable-div"
            className="overflow-y-auto flex-grow max-h-[calc(95vh-120px)] no-scrollbar"
          >
            <div className="text-base font-semibold border-b p-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <span>All Comments</span>
              <button
                className="text-gray-500 hover:text-gray-700 transition"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <InfiniteScroll
                dataLength={comments.length}
                next={loadMoreComments}
                hasMore={hasMoreComments}
                loader={<div className="text-center text-gray-400">Loading more...</div>}
                scrollableTarget="comments-scrollable-div"
              >
                {comments.map((c) => {
                  const isEditing = editingCommentId === c.id;
                  const canEdit =
                    userData?.user_name === c.User?.user_name &&
                    !c.replyCount &&
                    !c.likesCount &&
                    !c.dislikesCount;

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
                        alt="User"
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm font-medium text-gray-900">
                          <span>{c.User?.user_name || "Unknown"}</span>
                          <span className="text-gray-400 text-xs">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {isEditing ? (
                          <>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full border rounded-lg p-2 text-sm resize-none outline-none border-gray-300 focus:ring-2 focus:ring-pink-500 mt-1"
                              rows={3}
                              maxLength={300}
                              autoFocus
                            />

                            {/* Attachment icon */}
                            <div className="mt-2 flex items-center gap-2">
                              <label className="cursor-pointer text-gray-500 hover:text-black">
                                <Paperclip size={18} />
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  ref={editAttachmentInputRef}
                                  onChange={(e) =>
                                    setEditAttachment(e.target.files[0])
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {/* Edit Attachment Preview and Upload */}
                            {editAttachment ? (
                              <div className="relative inline-block mt-2 max-w-[150px]">
                                <button
                                  className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 hover:bg-black z-10"
                                  onClick={() => setEditAttachment(null)}
                                >
                                  <X size={14} />
                                </button>
                                {editAttachment.type.startsWith("video/") ? (
                                  <video
                                    src={URL.createObjectURL(editAttachment)}
                                    className="w-full h-24 rounded-lg object-cover"
                                    controls
                                  />
                                ) : (
                                  <img
                                    src={URL.createObjectURL(editAttachment)}
                                    className="w-full h-24 rounded-lg object-cover"
                                    alt="Preview"
                                  />
                                )}
                              </div>
                            ) : c.attachment && !attachmentToRemove ? (
                              <div className="relative inline-block mt-2 max-w-[150px]">
                                <button
                                  className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 hover:bg-black z-10"
                                  onClick={() => setAttachmentToRemove(1)}
                                >
                                  <X size={14} />
                                </button>
                                {c.attachment.match(/\.(mp4|mov|webm)$/i) ? (
                                  <video
                                    src={
                                      c.attachment?.startsWith("http")
                                        ? c.attachment
                                        : `https://assets-stage.queryloom.com/${c.attachment}`
                                    }
                                    controls
                                    className="w-full h-24 rounded-lg object-cover"
                                  />
                                ) : (
                                  <img
                                    src={
                                      c.attachment?.startsWith("http")
                                        ? c.attachment
                                        : `https://assets-stage.queryloom.com/${c.attachment}`
                                    }
                                    className="w-full h-24 rounded-lg object-cover"
                                    alt="Current Attachment"
                                  />
                                )}
                              </div>
                            ) : null}

                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => setEditingCommentId(null)}
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
                          </>
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
                                    className="max-w-full rounded-lg"
                                    alt="Comment attachment"
                                  />
                                )}
                              </div>
                            )}
                          </>
                        )}

                        <div className="flex gap-4 text-sm mt-2 text-gray-500">
                          <button
                            onClick={() => handleLikeDislike(c, "like")}
                            className={`flex items-center gap-1 ${
                              c.userLike ? "text-rose-500" : "hover:text-rose-500"
                            }`}
                          >
                            <ThumbsUp size={16} /> {c.likesCount || 0}
                          </button>
                          <button
                            onClick={() => handleLikeDislike(c, "dislike")}
                            className={`flex items-center gap-1 ${
                              c.userDislike
                                ? "text-blue-500"
                                : "hover:text-blue-500"
                            }`}
                          >
                            <ThumbsDown size={16} /> {c.dislikesCount || 0}
                          </button>
                          {c.replyCount > 0 && (
                            <button
                              onClick={() => {
                                setShowReplies((prev) => {
                                  const newState = {
                                    ...prev,
                                    [c.id]: !prev[c.id],
                                  };
                                  if (!prev[c.id] && !loadingReplies[c.id]) fetchReplies(c.id);
                                  return newState;
                                });
                              }}
                              className="flex items-center gap-1"
                            >
                              <MessageCircle size={16} />
                              <span>{c.replyCount}</span>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleReply(c.id, c.User?.user_name || "User")
                            }
                          >
                            ↩ Reply
                          </button>
                          {canEdit && (
                            <button onClick={() => handleStartEdit(c.id, c.text)}>
                              <Edit size={16} />
                            </button>
                          )}
                          {userData?.user_name === c.User?.user_name && (
                            <button onClick={() => handleDelete(c.id)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {/* Replies (Level 1 & 2) */}
                        {showReplies[c.id] && (
                          <div
                            id={`replies-scrollable-div-${c.id}`}
                            style={{ maxHeight: '250px', overflowY: 'auto'}}
                          >
                            <InfiniteScroll
                              dataLength={replies[c.id]?.length || 0}
                              next={() => loadMoreReplies(c.id)}
                              hasMore={!!hasMoreReplies[c.id]}
                              loader={<div className="text-center text-gray-400 text-xs">Loading more replies...</div>}
                              scrollableTarget={`replies-scrollable-div-${c.id}`}
                              scrollThreshold={0.95}
                            >
                              {replies[c.id]?.map((r) => {
                                const isEditingReply = editingCommentId === r.id;
                                const canEditReply =
                                  userData?.user_name === r.User?.user_name &&
                                  !r.replyCount &&
                                  !r.likesCount &&
                                  !r.dislikesCount;

                                return (
                                  <div
                                    key={r.id}
                                    className="ml-6 mt-3 bg-gray-50 p-2 rounded-lg"
                                  >
                                    <div className="flex gap-3">
                                      <img
                                        src={
                                          r.User?.profile
                                            ? `https://assets-stage.queryloom.com/${r.User.profile}`
                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                r.User?.user_name || "User"
                                              )}`
                                        }
                                        className="w-7 h-7 rounded-lg object-cover"
                                      />
                                      <div className="flex-1">
                                        <div className="flex justify-between text-sm font-medium text-gray-900">
                                          <span>{r.User?.user_name}</span>
                                          <span className="text-gray-400 text-xs">
                                            {new Date(r.createdAt).toLocaleString()}
                                          </span>
                                        </div>
                                        {isEditingReply ? (
                                          <>
                                            <textarea
                                              value={editText}
                                              onChange={(e) =>
                                                setEditText(e.target.value)
                                              }
                                              className="w-full border rounded-lg p-2 text-sm resize-none outline-none border-gray-300 focus:ring-2 focus:ring-pink-500 mt-1"
                                              rows={3}
                                              maxLength={300}
                                              autoFocus
                                            />

                                            {/* Attachment Preview / Remove */}
                                            {editAttachment ? (
                                              <div className="relative inline-block mt-2 max-w-[150px]">
                                                <button
                                                  className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 hover:bg-black z-10"
                                                  onClick={() =>
                                                    setEditAttachment(null)
                                                  }
                                                >
                                                  <X size={14} />
                                                </button>
                                                {editAttachment.type.startsWith(
                                                  "video/"
                                                ) ? (
                                                  <video
                                                    src={URL.createObjectURL(
                                                      editAttachment
                                                    )}
                                                    className="w-full h-24 rounded-lg object-cover"
                                                    controls
                                                  />
                                                ) : (
                                                  <img
                                                    src={URL.createObjectURL(
                                                      editAttachment
                                                    )}
                                                    className="w-full h-24 rounded-lg object-cover"
                                                    alt="Attachment Preview"
                                                  />
                                                )}
                                              </div>
                                            ) : r.attachment &&
                                              !attachmentToRemove ? (
                                              <div className="relative inline-block mt-2 max-w-[150px]">
                                                <button
                                                  className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 hover:bg-black z-10"
                                                  onClick={() =>
                                                    setAttachmentToRemove(1)
                                                  }
                                                >
                                                  <X size={14} />
                                                </button>
                                                {r.attachment.match(
                                                  /\.(mp4|mov|webm)$/i
                                                ) ? (
                                                  <video
                                                    src={`https://assets-stage.queryloom.com/${r.attachment}`}
                                                    controls
                                                    className="w-full h-24 rounded-lg object-cover"
                                                  />
                                                ) : (
                                                  <img
                                                    src={`https://assets-stage.queryloom.com/${r.attachment}`}
                                                    className="w-full h-24 rounded-lg object-cover"
                                                    alt="Current Attachment"
                                                  />
                                                )}
                                              </div>
                                            ) : null}

                                            {/* Paperclip Button */}
                                            <div className="mt-2 flex items-center gap-2">
                                              <label className="cursor-pointer text-gray-500 hover:text-black">
                                                <Paperclip size={18} />
                                                <input
                                                  type="file"
                                                  accept="image/*,video/*"
                                                  ref={editAttachmentInputRef}
                                                  onChange={(e) =>
                                                    setEditAttachment(
                                                      e.target.files[0]
                                                    )
                                                  }
                                                  className="hidden"
                                                />
                                              </label>
                                            </div>

                                            <div className="flex justify-end gap-2 mt-2">
                                              <button
                                                onClick={() =>
                                                  setEditingCommentId(null)
                                                }
                                                className="text-sm text-gray-500 hover:text-gray-700"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleEditSubmit(r.id, true, c.id)
                                                }
                                                className="text-sm bg-pink-500 text-white px-3 py-1 rounded-lg hover:bg-pink-600"
                                              >
                                                Save
                                              </button>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <p className="text-sm text-gray-700 mt-1">
                                              {r.text}
                                            </p>
                                            {r.attachment && (
                                              <div className="mt-2">
                                                {r.attachment.match(
                                                  /\.(mp4|mov|webm)$/i
                                                ) ? (
                                                  <video
                                                    src={`https://assets-stage.queryloom.com/${r.attachment}`}
                                                    controls
                                                    className="max-w-full rounded-lg"
                                                  />
                                                ) : (
                                                  <img
                                                    src={`https://assets-stage.queryloom.com/${r.attachment}`}
                                                    className="max-w-full rounded-lg"
                                                    alt="Comment attachment"
                                                  />
                                                )}
                                              </div>
                                            )}
                                          </>
                                        )}
                                        <div className="flex gap-4 text-xs mt-2 text-gray-500">
                                          <button
                                            onClick={() =>
                                              handleLikeDislike(r, "like", true, c.id)
                                            }
                                            className={`flex items-center gap-1 ${
                                              r.userLike
                                                ? "text-rose-500"
                                                : "hover:text-rose-500"
                                            }`}
                                          >
                                            <ThumbsUp size={14} /> {r.likesCount || 0}
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleLikeDislike(
                                                r,
                                                "dislike",
                                                true,
                                                c.id
                                              )
                                            }
                                            className={`flex items-center gap-1 ${
                                              r.userDislike
                                                ? "text-blue-500"
                                                : "hover:text-blue-500"
                                            }`}
                                          >
                                            <ThumbsDown size={14} />{" "}
                                            {r.dislikesCount || 0}
                                          </button>
                                          {r.replyCount > 0 && (
                                            <button
                                              onClick={() => {
                                                setShowNestedReplies((prev) => ({
                                                  ...prev,
                                                  [r.id]: !prev[r.id],
                                                }));
                                                if (!nestedReplies[r.id] && !loadingNestedReplies[r.id]) {
                                                  fetchNestedReplies(r.id);
                                                }
                                              }}
                                              className="flex items-center gap-1"
                                            >
                                              <MessageCircle size={14} />
                                              <span>{r.replyCount}</span>
                                            </button>
                                          )}
                                          <button
                                            onClick={() =>
                                              handleReply(
                                                r.id,
                                                r.User?.user_name || "User"
                                              )
                                            }
                                          >
                                            ↩ Reply
                                          </button>
                                          {canEditReply && (
                                            <button
                                              onClick={() =>
                                                handleStartEdit(r.id, r.text)
                                              }
                                            >
                                              <Edit size={14} />
                                            </button>
                                          )}
                                          {userData?.user_name ===
                                            r.User?.user_name && (
                                            <button
                                              onClick={() =>
                                                handleDelete(r.id, true, c.id)
                                              }
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </div>

                                        {/* Nested replies infinite scroll */}
                                        {showNestedReplies[r.id] && (
                                          <div
                                            id={`nested-replies-scrollable-div-${r.id}`}
                                            style={{ maxHeight: '180px', overflowY: 'auto' }}
                                          >
                                            <InfiniteScroll
                                              dataLength={nestedReplies[r.id]?.length || 0}
                                              next={() => loadMoreNestedReplies(r.id)}
                                              hasMore={!!hasMoreNestedReplies[r.id]}
                                              loader={<div className="text-center text-gray-400 text-xs">Loading more nested replies...</div>}
                                              scrollableTarget={`nested-replies-scrollable-div-${r.id}`}
                                              scrollThreshold={0.95}
                                            >
                                              {nestedReplies[r.id]?.map((nr) => {
                                                const isEditingNested = editingCommentId === nr.id;
                                                const canEditNested =
                                                  userData?.user_name === nr.User?.user_name &&
                                                  !nr.replyCount &&
                                                  !nr.likesCount &&
                                                  !nr.dislikesCount;

                                                return (
                                                  <div
                                                    key={nr.id}
                                                    className="ml-6 mt-2 bg-white p-2 rounded-lg border"
                                                  >
                                                    <div className="flex gap-2">
                                                      <img
                                                        src={
                                                          nr.User?.profile
                                                            ? `https://assets-stage.queryloom.com/${nr.User.profile}`
                                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                nr.User?.user_name || "User"
                                                              )}`
                                                        }
                                                        className="w-6 h-6 rounded-lg object-cover"
                                                      />
                                                      <div className="flex-1">
                                                        <div className="flex justify-between text-xs font-medium text-gray-900">
                                                          <span>
                                                            {nr.User?.user_name}
                                                          </span>
                                                          <span className="text-gray-400">
                                                            {new Date(nr.createdAt).toLocaleString()}
                                                          </span>
                                                        </div>
                                                        {isEditingNested ? (
                                                          <>
                                                            <textarea
                                                              value={editText}
                                                              onChange={(e) =>
                                                                setEditText(
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="w-full border rounded-lg p-2 text-xs resize-none outline-none border-gray-300 focus:ring-2 focus:ring-pink-500 mt-1"
                                                              rows={2}
                                                              maxLength={300}
                                                              autoFocus
                                                            />

                                                            {/* Attachment Preview / Remove */}
                                                            {editAttachment ? (
                                                              <div className="relative inline-block mt-2 max-w-[150px]">
                                                                <button
                                                                  className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 hover:bg-black z-10"
                                                                  onClick={() =>
                                                                    setEditAttachment(
                                                                      null
                                                                    )
                                                                  }
                                                                >
                                                                  <X size={14} />
                                                                </button>
                                                                {editAttachment.type.startsWith(
                                                                  "video/"
                                                                ) ? (
                                                                  <video
                                                                    src={URL.createObjectURL(
                                                                      editAttachment
                                                                    )}
                                                                    className="w-full h-24 rounded-lg object-cover"
                                                                    controls
                                                                  />
                                                                ) : (
                                                                  <img
                                                                    src={URL.createObjectURL(
                                                                      editAttachment
                                                                    )}
                                                                    className="w-full h-24 rounded-lg object-cover"
                                                                    alt="Attachment Preview"
                                                                  />
                                                                )}
                                                              </div>
                                                            ) : nr.attachment &&
                                                              !attachmentToRemove ? (
                                                              <div className="relative inline-block mt-2 max-w-[150px]">
                                                                <button
                                                                  className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 hover:bg-black z-10"
                                                                  onClick={() =>
                                                                    setAttachmentToRemove(
                                                                      1
                                                                    )
                                                                  }
                                                                >
                                                                  <X size={14} />
                                                                </button>
                                                                {nr.attachment.match(
                                                                  /\.(mp4|mov|webm)$/i
                                                                ) ? (
                                                                  <video
                                                                    src={`https://assets-stage.queryloom.com/${nr.attachment}`}
                                                                    controls
                                                                    className="w-full h-24 rounded-lg object-cover"
                                                                  />
                                                                ) : (
                                                                  <img
                                                                    src={`https://assets-stage.queryloom.com/${nr.attachment}`}
                                                                    className="w-full h-24 rounded-lg object-cover"
                                                                    alt="Current Attachment"
                                                                  />
                                                                )}
                                                              </div>
                                                            ) : null}

                                                            {/* Paperclip */}
                                                            <div className="mt-2 flex items-center gap-2">
                                                              <label className="cursor-pointer text-gray-500 hover:text-black">
                                                                <Paperclip size={18} />
                                                                <input
                                                                  type="file"
                                                                  accept="image/*,video/*"
                                                                  ref={
                                                                    editAttachmentInputRef
                                                                  }
                                                                  onChange={(e) =>
                                                                    setEditAttachment(
                                                                      e.target.files[0]
                                                                    )
                                                                  }
                                                                  className="hidden"
                                                                />
                                                              </label>
                                                            </div>
                                                            <div className="flex justify-end gap-2 mt-1">
                                                              <button
                                                                onClick={() =>
                                                                  setEditingCommentId(
                                                                    null
                                                                  )
                                                                }
                                                                className="text-xs text-gray-500 hover:text-gray-700"
                                                              >
                                                                Cancel
                                                              </button>
                                                              <button
                                                                onClick={() =>
                                                                  handleEditSubmit(
                                                                    nr.id,
                                                                    true,
                                                                    r.id
                                                                  )
                                                                }
                                                                className="text-xs bg-pink-500 text-white px-2 py-1 rounded-lg hover:bg-pink-600"
                                                              >
                                                                Save
                                                              </button>
                                                            </div>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <p className="text-xs text-gray-700 mt-1">
                                                              {nr.text}
                                                            </p>
                                                            {nr.attachment && (
                                                              <div className="mt-1">
                                                                {nr.attachment.match(
                                                                  /\.(mp4|mov|webm)$/i
                                                                ) ? (
                                                                  <video
                                                                    src={`https://assets-stage.queryloom.com/${nr.attachment}`}
                                                                    controls
                                                                    className="max-w-full rounded-lg"
                                                                  />
                                                                ) : (
                                                                  <img
                                                                    src={`https://assets-stage.queryloom.com/${nr.attachment}`}
                                                                    className="max-w-full rounded-lg"
                                                                    alt="Comment attachment"
                                                                  />
                                                                )}
                                                              </div>
                                                            )}
                                                          </>
                                                        )}
                                                        <div className="flex gap-3 text-xs mt-1 text-gray-500">
                                                          <button
                                                            onClick={() =>
                                                              handleLikeDislike(
                                                                nr,
                                                                "like",
                                                                true,
                                                                r.id
                                                              )
                                                            }
                                                            className={`flex items-center gap-1 ${
                                                              nr.userLike
                                                                ? "text-rose-500"
                                                                : "hover:text-rose-500"
                                                            }`}
                                                          >
                                                            <ThumbsUp size={12} />{" "}
                                                            {nr.likesCount || 0}
                                                          </button>
                                                          <button
                                                            onClick={() =>
                                                              handleLikeDislike(
                                                                nr,
                                                                "dislike",
                                                                true,
                                                                r.id
                                                              )
                                                            }
                                                            className={`flex items-center gap-1 ${
                                                              nr.userDislike
                                                                ? "text-blue-500"
                                                                : "hover:text-blue-500"
                                                            }`}
                                                          >
                                                            <ThumbsDown size={12} />{" "}
                                                            {nr.dislikesCount || 0}
                                                          </button>
                                                          {canEditNested && (
                                                            <button
                                                              onClick={() =>
                                                                handleStartEdit(
                                                                  nr.id,
                                                                  nr.text
                                                                )
                                                              }
                                                            >
                                                              <Edit size={12} />
                                                            </button>
                                                          )}
                                                          {userData?.user_name ===
                                                            nr.User?.user_name && (
                                                            <button
                                                              onClick={() =>
                                                                handleDelete(
                                                                  nr.id,
                                                                  true,
                                                                  r.id
                                                                )
                                                              }
                                                            >
                                                              <Trash2 size={12} />
                                                            </button>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </InfiniteScroll>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </InfiniteScroll>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </InfiniteScroll>
            </div>
          </div>

          {/* Comment Input Box */}
          <div className="flex gap-3 p-4 border-t">
            <img
              src={
                userData?.profile
                  ? `https://assets-stage.queryloom.com/${userData.profile}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userData?.name || "User"
                    )}`
              }
              className="w-10 h-10 rounded-lg object-cover mt-1"
              alt="User profile"
            />
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (comment.trim() || commentAttachment) {
                      handleAddComment(e);
                    }
                  }
                }}
                placeholder={
                  replyingToCommentId
                    ? "Write a reply..."
                    : "Add your comment..."
                }
                maxLength={300}
                className="text-gray-500 w-full border rounded-xl p-3 pb-10 pr-28 text-sm resize-none outline-none border-gray-300 focus:ring-2 focus:ring-pink-500 transition bg-gray-100"
              />
              <div className="absolute bottom-4 left-3 flex gap-2 text-gray-500">
                <label className="hover:text-black cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    ref={commentAttachmentInputRef}
                    onChange={(e) => setCommentAttachment(e.target.files?.[0])}
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
                <div className="relative inline-block mt-2 max-w-[150px]">
                  <button
                    className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 hover:bg-black z-10"
                    onClick={() => setCommentAttachment(null)}
                  >
                    <X size={14} />
                  </button>
                  {commentAttachment.type.startsWith("video/") ? (
                    <video
                      src={URL.createObjectURL(commentAttachment)}
                      className="w-full h-24 rounded-lg object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(commentAttachment)}
                      className="w-full h-24 rounded-lg object-cover"
                      alt="Attachment Preview"
                    />
                  )}
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