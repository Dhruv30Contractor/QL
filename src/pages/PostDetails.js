import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PostCard from "../components/PostCard";
import { BASE_URL } from "../config";

export default function PostDetails() {
  const location = useLocation();
  // Extract post ID from the pathname, assuming URL like "/polls/2060"
  const postId = location.pathname.split("/").pop();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return;

    async function fetchPost() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/polls/${postId}`);
        if (!res.ok) throw new Error("Failed to fetch post data");
        const data = await res.json();
        setPost(data[0]);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  if (loading) return <div className="p-4 text-center">Loading post...</div>;
  if (error)
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  if (!post) return <div className="p-4 text-center">No post found.</div>;

  return (
    <div className="flex flex-col w-full m-5 overflow-y-auto no-scrollbar">
      <PostCard post={post} />
    </div>
  );
}
