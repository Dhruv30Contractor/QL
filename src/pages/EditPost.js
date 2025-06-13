import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config";
import PollForm from "../components/PollForm";
import PostForm from "../components/PostForm";


const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        console.log("Fetching post with ID:", id);
        const response = await axios.get(`${BASE_URL}/polls/${id}?action=editPoll`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        console.log("API Response:", response.data);

        if (response.data && response.data.length > 0) {
          setPost(response.data[0]);
        } else {
          setError("Post not found");
        }
      } catch (err) {
        console.error("Error details:", err);
        setError(err.response?.data?.message || "Error fetching post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleUpdateSuccess = () => {
    // Get the return URL from the query parameters
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get("from");
    const fromId = searchParams.get("fromId");
    
    if (returnUrl) {
      // If there's a return URL, navigate back to it
      navigate(returnUrl.replace("[user_name]", fromId));
    } else {
      // Otherwise, navigate to the user's profile
      navigate(`/user/${post.User.user_name}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Post not found</div>
      </div>
    );
  }

  console.log("Rendering post:", post);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit {post.type === "poll" ? "Poll" : "Post"}</h1>
      {post.type === "poll" ? (
        <PollForm
          initialData={{
            question: post.question,
            options: post.Options.map(opt => ({
              id: opt.id,
              text: opt.option,
              votesCount: opt.votesCount
            })),
            expiration: post.expiration,
            visibility: post.visibility,
            commentPermission: post.comment_permission,
            interests: post.Interests.map(interest => ({
              id: interest.id,
              name: interest.name
            })),
            tags: post.Tags.map(tag => ({
              id: tag.id,
              name: tag.name
            })),
            attachments: post.attachments.map(att => ({
              id: att.id,
              url: `https://assets-stage.queryloom.com/${att.attachment}`,
              type: att.attachment.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image'
            })),
            isEdit: true,
            postId: post.id,
            scheduled: post.scheduled === 1,
            scheduled_date: post.scheduled === 1 ? (post.scheduled_date || post.createdAt) : null,
            incognito: post.incognito === 1,
            isOutcome: post.is_outcome,
            isPublished: post.scheduled === 0
          }}
          onSuccess={handleUpdateSuccess}
        />
      ) : (
        <PostForm
          initialData={{
            question: post.question,
            expiration: post.expiration,
            visibility: post.visibility,
            commentPermission: post.comment_permission,
            interests: post.Interests.map(interest => ({
              id: interest.id,
              name: interest.name
            })),
            tags: post.Tags.map(tag => ({
              id: tag.id,
              name: tag.name
            })),
            attachments: post.attachments.map(att => ({
              id: att.id,
              url: `https://assets-stage.queryloom.com/${att.attachment}`,
              type: att.attachment.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image'
            })),
            isEdit: true,
            postId: post.id,
            scheduled: post.scheduled === 1,
            scheduled_date: post.scheduled === 1 ? (post.scheduled_date || post.createdAt) : null,
            incognito: post.incognito === 1,
            isPublished: post.scheduled === 0
          }}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default EditPost; 