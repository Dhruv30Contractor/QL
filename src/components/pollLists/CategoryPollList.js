import { useEffect, useState, useRef, useCallback } from "react";
import PostCard from "../PostCard";
import { BASE_URL } from "../../config";

const CategoryPollList = ({ category, onOpenModal }) => {
  const [polls, setPolls] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const fetchPolls = async (pageNumber, currentCategory) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const userId = user ? JSON.parse(user).id : null;
      const limit = 10;

      let url = "";
      let options = {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      };

      switch (currentCategory) {
        case "my posts":
          if (!userId) throw new Error("User ID not found in localStorage");

          // Construct query parameters manually
          const queryParams = new URLSearchParams({
            page: pageNumber.toString(),
            limit: limit.toString(),
            category: "posted",
            // forProfile: userId,
            include_unpublished: "true", // or "false" based on logic
          });

          url = `${BASE_URL}/polls/get-polls?${queryParams.toString()}`;

          options.method = "POST";
          options.headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          };
          options.body = JSON.stringify({});
        break;



        case "scheduled posts":
            url = `${BASE_URL}/polls/get-polls?page=${pageNumber}&limit=${limit}&category=scheduled`;
            options.method = "POST";
            options.body = JSON.stringify({
              scheduled: true,
              status: "scheduled"
            });
            break;

        case "saved posts":
          url = `${BASE_URL}/polls/get-polls?page=${pageNumber}&limit=${limit}&category=saved`;
          options.method = "POST";
          break;

        case "following":
          url = `${BASE_URL}/polls/get-polls?page=${pageNumber}&limit=${limit}&category=following`;
          options.method = "POST";
          break;

        case "inner circle":
          url = `${BASE_URL}/polls/get-polls?page=${pageNumber}&limit=${limit}&category=following_and_following_back`;
          options.method = "POST";
          break;

        case "interests":
        case "user_interest":
          url = `${BASE_URL}/polls/get-polls?page=${pageNumber}&limit=${limit}&category=user_interest`;
          options.method = "POST";
          break;

        case "latest":
          url = `${BASE_URL}/polls/get-polls?page=${pageNumber}&limit=${limit}&category=recent`;
          options.method = "POST";
          break;

        case "trending":
          url = `${BASE_URL}/polls/get-polls?page=${pageNumber}&limit=${limit}&category=${encodeURIComponent(currentCategory)}`;
          options.method = "POST";
          break;

        default:
          url = `${BASE_URL}/polls/get-polls?page=${pageNumber}&limit=${limit}&category=trending`;
          options.method = "POST";
      }

      if (options.method === "POST") {
        options.body = JSON.stringify({});
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }

      const result = await response.json();
      const pollsArray = Array.isArray(result) ? result : result.polls;

      if (!Array.isArray(pollsArray)) {
        console.error("Unexpected response shape:", result);
        return;
      }

      // Filter out scheduled posts from my posts section
      const filteredPolls = currentCategory === "my posts" 
        ? pollsArray.filter(poll => poll.scheduled !== 1)
        : pollsArray;

      const newHasMore = filteredPolls.length === limit;

      setPolls((prevPolls) =>
        pageNumber === 1 ? filteredPolls : [...prevPolls, ...filteredPolls]
      );
      setHasMore(newHasMore);
    } catch (error) {
      console.error("Failed to fetch polls:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle post unsave
  const handlePostUnsave = (postId) => {
    if (category === "saved posts") {
      setPolls((prevPolls) => prevPolls.filter((poll) => poll.id !== postId));
    }
  };

  const handleDelete = (postId) => {
    setPolls((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleUpdate = (updatedPost) => {
    setPolls((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  useEffect(() => {
    setPolls([]);
    setPage(1);
    setHasMore(true);
    fetchPolls(1, category);
  }, [category]);

  useEffect(() => {
    if (page !== 1) {
      fetchPolls(page, category);
    }
  }, [page, category]);

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
          <p className="text-center text-gray-500">No posts found.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryPollList;
