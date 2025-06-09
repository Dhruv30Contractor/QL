import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PollForm from "../components/PollForm";
import PostForm from "../components/PostForm";
import { BASE_URL } from "../config";

const RepublishPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${BASE_URL}/polls/${id}?action=editPoll`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const res = await response.json();
        const data = Array.isArray(res) ? res[0] : res;
        setPost(data);
      } catch (err) {
        setError("Failed to fetch post for republish.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleSuccess = () => {
    navigate("/my-posts");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (error || !post) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error || "Post not found"}</div>;
  }

  // Prepare initialData for the form
  const initialData = {
    ...post,
    isRepublish: true,
    republish_poll_id: post.id,
    options: post.Options ? post.Options.map(opt => ({ id: opt.id, text: opt.option, votesCount: opt.votesCount })) : undefined,
    attachments: post.attachments ? post.attachments.map(att => ({
      id: att.id,
      url: att.attachment ? `https://assets-stage.queryloom.com/${att.attachment}` : undefined,
      type: att.attachment && att.attachment.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image'
    })) : [],
    commentPermission: post.comment_permission,
    isOutcome: post.is_outcome,
    scheduled: post.scheduled === 1,
    scheduled_date: post.scheduled_date,
    incognito: post.incognito === 1,
    visibility: post.visibility,
    expiration: post.expiration
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Republish {post.type === "poll" ? "Poll" : "Post"}</h1>
      {post.type === "poll" ? (
        <PollForm initialData={initialData} onSuccess={handleSuccess} />
      ) : (
        <PostForm initialData={initialData} onSuccess={handleSuccess} />
      )}
    </div>
  );
};

export default RepublishPost; 