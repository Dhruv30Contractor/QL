import { useState, useEffect, useRef } from "react";
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
      if (
        content.scrollTop + content.clientHeight >=
          content.scrollHeight - 100 &&
        !loading &&
        hasMore
      ) {
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

      if (activeTab === "users") {
        response = await axios.get(`${BASE_URL}/user/username`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: { search: searchQuery, page, limit },
        });

        const newData = response.data?.data || [];
        setFilteredData((prev) => [...prev, ...newData]);
        const total = parseInt(response.headers["x-total-count"] || "0");
        setTotalCounts((prev) => ({ ...prev, users: total }));
        if (filteredData.length + newData.length >= total) setHasMore(false);
      } else if (activeTab === "posts") {
        response = await axios.post(
          `${BASE_URL}/polls/get-polls`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            params: {
              search: searchQuery,
              page,
              limit,
              category: "trending",
              order: "random",
            },
          }
        );

        const newData = response.data || [];
        setFilteredData((prev) => [...prev, ...newData]);
        const total = parseInt(response.headers["x-total-count"] || "0");
        setTotalCounts((prev) => ({ ...prev, posts: total }));
        if (filteredData.length + newData.length >= total) setHasMore(false);
      } else if (activeTab === "tags") {
        response = await axios.get(`${BASE_URL}/polls/get-tags`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: { tag_name: searchQuery, page, limit, action: "" },
        });

        const newData = response.data?.data || [];
        setFilteredData((prev) => [...prev, ...newData]);
        const total = parseInt(response.headers["x-total-count"] || "0");
        setTotalCounts((prev) => ({ ...prev, tags: total }));
        if (filteredData.length + newData.length >= total) setHasMore(false);
      } else if (activeTab === "categories") {
        response = await axios.get(`${BASE_URL}/interest/get-all-interest`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: { interest_name: searchQuery, page, limit, type: "trending" },
        });

        const newData = response.data?.data?.rows || [];
        const total = response.data?.data?.count || 0;
        setFilteredData((prev) => [...prev, ...newData]);
        setTotalCounts((prev) => ({ ...prev, categories: total }));
        if (filteredData.length + newData.length >= total) setHasMore(false);
      }

      setPage((prev) => prev + 1);
    } catch (err) {
      console.error("Search fetch error:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch on search change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() !== "" || dropdownOpen) {
        fetchData();
      }
    }, 300); // Debounce time

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeTab, dropdownOpen]);

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
            placeholder={`Search for ${activeTab}...`}
            className="flex-1 outline-none text-sm placeholder-gray-500 text-gray-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg max-h-[67vh] overflow-auto border border-gray-200 z-40"
          >
            {/* Tabs */}
            <div className="flex justify-between border-b border-gray-300 px-10">
              {["posts", "users", "tags", "categories"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSearchQuery(""); // Clear query so it doesn't fetch immediately
                    setFilteredData([]); // Clear old data
                  }}
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

            <div className="flex justify-between text-lg font-semibold text-gray-800 px-6 py-3 bg-gray-50 border-b border-gray-300">
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
              className="max-h-[50vh] overflow-auto px-6 pb-6"
            >
              {loading ? (
                <p className="text-center text-gray-500 pt-6">Loading...</p>
              ) : filteredData.length === 0 ? (
                <p className="text-center text-gray-500 pt-6">
                  No {activeTab} found.
                </p>
              ) : (
                <ul>
                  {filteredData.map((item, i) => (
                    <li
                      key={item.id || i}
                      className="border-b border-gray-200 py-2 cursor-pointer hover:bg-rose-50 px-2 rounded"
                      onClick={() => {
                        if (activeTab === "posts") navigate(`/post/${item.id}`);
                        else if (activeTab === "tags")
                          navigate(`/tag/${item.tag_name}`);
                        else if (activeTab === "categories")
                          navigate(`/interest/${item.name}`);

                        setDropdownOpen((prev) => !prev);
                      }}
                    >
                      {activeTab === "posts" && (
                        <div className="flex items-center py-2">
                          {item?.question}
                        </div>
                      )}
                      {activeTab === "users" && item.user_name && item.id && (
                        <Link
                          key={item.id || i}
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
                      {activeTab === "categories" && (
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
                  ))}
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
