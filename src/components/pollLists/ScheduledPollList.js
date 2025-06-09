import { useEffect, useState, useRef, useCallback } from "react";
import PostCard from "../PostCard";
import { BASE_URL } from "../../config";

const ScheduledPollList = ({ onOpenModal }) => {
  const [polls, setPolls] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const fetchProfilePolls = async (pageNumber) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const limit = 10;

      const response = await fetch(
        `${BASE_URL}/user/profile/?page=${pageNumber}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const result = await response.json();

      if (!result.data || !Array.isArray(result.data)) {
        console.error("Unexpected response format:", result);
        return;
      }

      // Filter only scheduled posts
      const scheduledPolls = result.data.filter((post) => post.scheduled === 1);

      const isMore = scheduledPolls.length === limit;

      setPolls((prev) =>
        pageNumber === 1 ? scheduledPolls : [...prev, ...scheduledPolls]
      );
      setHasMore(isMore);
    } catch (error) {
      console.error("Error fetching scheduled polls:", error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (postId) => {
    setPolls((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleUpdate = (updatedPost) => {
    setPolls((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
  };

  const handlePostUnsave = (postId) => {
    setPolls((prevPolls) => prevPolls.filter((poll) => poll.id !== postId));
  };

  useEffect(() => {
    setPolls([]);
    setPage(1);
    setHasMore(true);
    fetchProfilePolls(1);
  }, []);

  useEffect(() => {
    if (page !== 1) {
      fetchProfilePolls(page);
    }
  }, [page]);

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  return (
    <div className="flex flex-col m-5 rounded-xl overflow-y-auto no-scrollbar">
      <div className="space-y-6 pb-10">
        {polls.map((post, index) => (
          <div
            key={post.id || index}
            ref={index === polls.length - 1 ? lastPostRef : null}
          >
            <PostCard
              post={post}
              onOpenModal={onOpenModal}
              onUnsave={handlePostUnsave}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          </div>
        ))}

        {loading && (
          <p className="text-center text-sm text-gray-500">Loading...</p>
        )}

        {!loading && !hasMore && polls.length === 0 && (
          <p className="text-center text-gray-500">
            No scheduled posts found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ScheduledPollList;
