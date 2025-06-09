import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import PostCard from "../PostCard";
import { BASE_URL } from "../../config";

const InterestPollList = ({ topic, onOpenModal }) => {
  const [polls, setPolls] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const fetchPolls = async (pageNumber, currentTopic) => {
    try {
      setLoading(true);

      const sanitizedTopic = currentTopic.replace(/&/g, "and");
      const url = `${BASE_URL}/polls/filtered-poll?category=interest&name=${encodeURIComponent(
        sanitizedTopic
      )}&page=${pageNumber}&limit=10`;

      const response = await fetch(url);
      const result = await response.json();

      if (!Array.isArray(result)) {
        console.error("API returned unexpected shape:", result);
        return;
      }

      const newHasMore = result.length === 10;

      // Merge new posts
      setPolls((prev) =>
        pageNumber === 1 ? result : [...prev, ...result.filter(p => !prev.some(prevP => prevP.id === p.id))]
      );
      setHasMore(newHasMore);
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset on topic change
  useEffect(() => {
    setPolls([]);
    setPage(1);
    setHasMore(true);
    fetchPolls(1, topic);
  }, [topic]);

  // Fetch next page
  useEffect(() => {
    if (page !== 1) {
      fetchPolls(page, topic);
    }
  }, [page, topic]);

  // Infinite scroll observer
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

  const handlePostUnsave = (postId) => {
    // Remove the post from the list if it was unsaved
    setPolls(prevPolls => prevPolls.filter(poll => poll.id !== postId));
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <h2 className="text-lg font-semibold p-4 bg-white sticky top-0 z-20 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-black transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-pink-600" />
        </button>
        {topic}
      </h2>

      {/* Poll List */}
      <div className="flex flex-col m-5 rounded-xl space-y-5 overflow-y-auto no-scrollbar">
        {polls.map((post, index) => (
          <div
            key={post.id || index}
            ref={index === polls.length - 1 ? lastPostRef : null}
          >
            <PostCard 
              post={post} 
              onOpenModal={onOpenModal}
              onUnsave={handlePostUnsave}
            />
          </div>
        ))}

        {loading && (
          <p className="text-center text-sm text-gray-500">Loading...</p>
        )}
        {!loading && polls.length === 0 && (
          <p className="text-center text-gray-500">No posts found.</p>
        )}
      </div>
    </div>
  );
};

export default InterestPollList;
