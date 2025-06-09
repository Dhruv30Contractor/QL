import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config";

export default function TopNavbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalCounts, setTotalCounts] = useState({
    posts: 0,
    users: 0,
    tags: 0,
    categories: 0,
  });

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

  useEffect(() => {
    setFilteredData([]);
    setPage(1);
    setHasMore(true);
  }, [activeTab]);

  const contentRef = useRef(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = content;

      // Check if we're near the bottom (within 100px)
      if (scrollHeight - scrollTop - clientHeight < 100 && !loading && hasMore) {
        fetchData();
      }
    };

    content.addEventListener("scroll", handleScroll);
    return () => content.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, activeTab, searchQuery]);

  const [filteredData, setFilteredData] = useState([]);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const fetchData = async () => {
    if (!hasMore) return;

    setLoading(true);
    try {
      let response;
      const limit = 10;

      // Add console logs for debugging
      console.log("Fetching data for:", {
        activeTab,
        searchQuery,
        page,
        limit,
      });

      // if (activeTab === "users") {
      //   // Encode spaces as %20 in the search query
        
      //   response = await axios.get(`${BASE_URL}/user/username`, {
      //     headers: {
      //       Authorization: `Bearer ${localStorage.getItem("token")}`,
      //     },
      //     params: { 
      //       search: searchQuery, // Send encoded search query
      //       page, 
      //       limit: 10
      //     },
      //   });

      //   console.log("Users API Response:", response.data);

      //   if (response.data?.status && Array.isArray(response.data.data)) {
      //     const newData = response.data.data;
      //     setFilteredData((prev) => [...prev, ...newData]);
      //     const total = parseInt(response.headers["x-total-count"] || "0");
      //     setTotalCounts((prev) => ({ ...prev, users: total }));
      //     setHasMore(newData.length === limit);
      //   } else {
      //     console.warn("Invalid users response format:", response.data);
      //     setFilteredData([]);
      //     setHasMore(false);
      //   }
      // }

      if (activeTab === "users") {
        // Encode the search query for URL but keep original text as payload
        const encodedSearch = encodeURIComponent(searchQuery.trim());
      
        // Manually build the full URL with encoded parameters
        const url = `${BASE_URL}/user/username?search=${encodedSearch}&page=${page}&limit=10`;
      
        try {
          response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
      
          console.log("Users API Response:", response.data);
      
          if (response.data?.status && Array.isArray(response.data.data)) {
            const newData = response.data.data;
            setFilteredData((prev) => [...prev, ...newData]);
            const total = parseInt(response.headers["x-total-count"] || "0");
            setTotalCounts((prev) => ({ ...prev, users: total }));
            setHasMore(newData.length === limit);
          } else {
            console.warn("Invalid users response format:", response.data);
            setFilteredData([]);
            setHasMore(false);
          }
        } catch (error) {
          console.error("Users API Error:", error);
          setFilteredData([]);
          setHasMore(false);
        }
      }
       else if (activeTab === "posts") {
        // Use GET /polls/search for both initial load and search
        // Don't encode the search query in params, let axios handle it
        response = await axios.get(
          `${BASE_URL}/polls/search`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            params: {
              search: searchQuery.trim(), // Just trim the spaces, don't encode
              page,
              limit: 10,
              category: "search",
              order: "random",
            },
          }
        );

        console.log("Polls Search Response:", response.data);

        if (response.data && Array.isArray(response.data)) {
          const newData = response.data;
          setFilteredData((prev) => [...prev, ...newData]);
          const total = parseInt(response.headers["x-total-count"] || "0");
          setTotalCounts((prev) => ({ ...prev, posts: total }));
          setHasMore(newData.length === 10);
        } else {
          console.warn("Invalid polls response format:", response.data);
          setFilteredData([]);
          setHasMore(false);
        }
      } else if (activeTab === "tags") {
        response = await axios.get(`${BASE_URL}/polls/get-tags`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: { tag_name: searchQuery, page, limit, action: "" },
        });

        console.log("Tags API Response:", response.data);

        if (response.data?.status && Array.isArray(response.data.data)) {
          const newData = response.data.data;
          setFilteredData((prev) => [...prev, ...newData]);
          const total = parseInt(response.headers["x-total-count"] || "0");
          setTotalCounts((prev) => ({ ...prev, tags: total }));
          setHasMore(newData.length === limit);
        } else {
          console.warn("Invalid tags response format:", response.data);
          setFilteredData([]);
          setHasMore(false);
        }
      } else if (activeTab === "categories") {
        try {
          response = await axios.get(`${BASE_URL}/interest/get-all-interest`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            params: { interest_name: searchQuery, page, limit, type: "trending" },
          });

          console.log("Categories API Response:", response.data);

          if (response.data?.data?.rows && Array.isArray(response.data.data.rows)) {
            const newData = response.data.data.rows;
            setFilteredData((prev) => [...prev, ...newData]);
            const total = response.data.data.count || 0;
            setTotalCounts((prev) => ({ ...prev, categories: total }));
            setHasMore(newData.length === limit);
          } else {
            console.warn("Invalid categories response format:", response.data);
            setFilteredData([]);
            setHasMore(false);
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
          setFilteredData([]);
          setHasMore(false);
        }
      }

      setPage((prev) => prev + 1);
    } catch (err) {
      console.error("Search fetch error:", err);
      setHasMore(false);
      setFilteredData([]);
      setTotalCounts((prev) => ({ ...prev, [activeTab]: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Improved tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setFilteredData([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  };

  // Separate useEffect for initial data fetch
  useEffect(() => {
    if (loading && hasMore && page === 1) {
      fetchData().catch((error) => {
        console.error("Initial data fetch error:", error);
        setFilteredData([]);
        setHasMore(false);
      });
    }
  }, [activeTab, loading, hasMore, page]);

  // Improved debounced search
  useEffect(() => {
    let isMounted = true;
    const delayDebounce = setTimeout(async () => {
      if (!isMounted) return;

      if (searchQuery.trim() !== "") {
        // Reset state before new search
        setFilteredData([]);
        setPage(1);
        setHasMore(true);
        setLoading(true);
      } else if (dropdownOpen && !loading) {
        // Only fetch initial data if not already loading
        setFilteredData([]);
        setPage(1);
        setHasMore(true);
        setLoading(true);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounce);
    };
  }, [searchQuery, activeTab, dropdownOpen]);

  // Update the search input handler to properly handle spaces
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setFilteredData([]);
      setTotalCounts((prev) => ({ ...prev, [activeTab]: 0 }));
      setHasMore(true);
      setPage(1);
      setLoading(true);
    }
  };

  // Close dropdown on escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Add new last item ref callback
  const lastItemRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchData();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  return (
    <div className="flex items-center justify-between w-full py-4 px-6 bg-white border-b border-gray-200 gap-4 relative max-w-7xl mx-auto">
      {/* Overlay */}
      {dropdownOpen && (
        <div
          onClick={() => setDropdownOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
        />
      )}

      {/* Search bar + dropdown wrapper */}
      <div className="relative flex-grow max-w-5xl z-50">
        {/* Search Bar */}
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm p-3 w-full">
          {/* Dropdown trigger */}
          <div
            className="flex items-center justify-between max-w-[100px] pr-3 mr-3 border-r border-gray-300 text-gray-600 font-medium text-sm cursor-pointer select-none"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            <ChevronDown className="w-4 h-4 ml-1" />
          </div>

          {/* Search Input */}
          <input
            ref={searchInputRef}
            type="text"
            placeholder={`Search for Posts, users and many more`}
            className="flex-1 outline-none text-sm placeholder-gray-500 text-gray-800"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setDropdownOpen(true)}
          />

          {/* Search Icon */}
          <Search
            className="w-4 h-4 text-rose-400 cursor-pointer"
            onClick={() => setDropdownOpen(true)}
          />
        </div>

        {/* Dropdown Panel */}
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg max-h-[67vh] flex flex-col border border-gray-200 z-40"
          >
            {/* Tabs */}
            <div className="flex justify-between border-b border-gray-300 px-10 sticky top-0 bg-white z-10">
              {["posts", "users", "tags", "categories"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`p-4 text-md font-medium ${
                    activeTab === tab
                      ? "border-b-2 border-rose-500 text-rose-600"
                      : "text-gray-600 hover:text-rose-500"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-lg font-semibold text-gray-800 px-6 py-3 bg-gray-50 border-b border-gray-300 sticky top-[49px] bg-white z-10">
              <p className="flex items-center gap-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (
                {totalCounts[activeTab]})
              </p>
              <button className="text-sm text-rose-500 font-medium hover:text-rose-600">
                View All
              </button>
            </div>

            {/* Content area */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto px-6 pb-6"
              style={{ maxHeight: "calc(67vh - 100px)" }}
            >
              {loading && filteredData.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <p className="text-gray-500">No {activeTab} found.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredData.map((item, i) => {
                    // Check for essential data to prevent blank rows
                    if (
                      activeTab === "users" &&
                      (!item?.user_name || !item?.id)
                    ) {
                      return null; // Skip rendering if data is missing
                    }
                    if (activeTab === "tags" && !item?.tag_name) {
                      return null; // Skip rendering if tag name is missing
                    }
                    if (activeTab === "categories" && !item?.name) {
                      return null; // Skip rendering if category name is missing
                    }
                    return (
                      <li
                        key={`${activeTab}-${item.id || item.tag_name || item.name || i}-${i}`}
                        ref={i === filteredData.length - 1 ? lastItemRef : null}
                        className="py-3 cursor-pointer hover:bg-rose-50 px-2 rounded transition-colors"
                        onClick={() => {
                          if (activeTab === "posts")
                            navigate(`/post/${item.id}`);
                          else if (activeTab === "tags")
                            navigate(`/tag/${item.tag_name}`);
                          else if (activeTab === "categories")
                            navigate(`/interest/${item?.name}`);

                          setDropdownOpen(false);
                          setSearchQuery("");
                          setFilteredData([]);
                          setPage(1);
                          setHasMore(true);
                        }}
                      >
                        {activeTab === "posts" && (
                          <div className="flex flex-col py-2">
                            <span className="font-semibold">{item?.question || item?.name}</span>
                            {item?.description && (
                              <span className="text-sm text-gray-500">{item?.description}</span>
                            )}
                          </div>
                        )}

                        {activeTab === "users" && item.user_name && item.id && (
                          <Link
                            to={`/user/${item.user_name}`}
                            state={{ userId: item.id }}
                            className="flex items-center gap-3 py-2"
                          >
                            <img
                              src={
                                item.profile
                                  ? `https://assets-stage.queryloom.com/${item.profile}`
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      item.user_name
                                    )}`
                              }
                              alt={item.name || "User"}
                              className="w-10 h-10 rounded-lg"
                            />
                            <div className="flex flex-col">
                              <span className="font-semibold">{item.name}</span>
                              <span className="text-sm text-gray-500">
                                @{item.user_name}
                              </span>
                            </div>
                          </Link>
                        )}
                        {activeTab === "tags" && (
                          <div className="flex flex-col py-2">
                            <span className="font-semibold">
                              #{item?.tag_name}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {item?.count} posts & polls
                            </span>
                          </div>
                        )}
                        {activeTab === "categories" && item?.name && (
                          <div className="flex flex-col py-2">
                            <span className="font-semibold">{item?.name}</span>
                            <span className="text-gray-500 text-sm">
                              {item?.count} posts
                            </span>
                            <span className="text-gray-500 text-sm">
                              {item?.info}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {loading && (
                    <li className="py-3 text-center text-gray-500">
                      Loading more...
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Post Button */}
      <button
        className="flex-shrink-0 flex items-center gap-1 border border-2 border-rose-100 bg-rose-50 text-black px-6 py-3 rounded-md text-sm font-medium hover:bg-rose-100 transition"
        onClick={() => navigate("/create-post")}
      >
        Create Post
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}