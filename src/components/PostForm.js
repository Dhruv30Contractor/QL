import { useState } from "react";
import { Smile, UploadCloud, Clock, Globe, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PostForm = () => {
  const [postContent, setPostContent] = useState("");
  const [postAllowComments, setPostAllowComments] = useState(true);
  const [postMedia, setPostMedia] = useState(null);

  const [visibility, setVisibility] = useState("Public");
  const [showDropdown, setShowDropdown] = useState(false);

  const [pollQuestion, setPollQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowComments, setAllowComments] = useState("everyone");

  const navigate = useNavigate();

  // Handle file selection
  const handleMediaChange = (e) => {
    setPostMedia(e.target.files[0]);
  };

  // Toggle visibility dropdown
  const toggleVisibilityDropdown = (e) => {
    e.preventDefault();
    setShowDropdown((prev) => !prev);
  };

  // Set visibility option
  const handleVisibilityChange = (option) => {
    setVisibility(option);
    setShowDropdown(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!postContent.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      // Step 1: Upload media if present
      const attachments = [];

      if (postMedia) {
        const mediaFormData = new FormData();
        mediaFormData.append("file", postMedia);

        const token = localStorage.getItem("token");

        const uploadResponse = await fetch(
          "https://api-stage.queryloom.com/file-upload",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: mediaFormData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Media upload failed.");
        }

        const uploadResult = await uploadResponse.json();

        if (uploadResult?.file) {
          // Get image dimensions
          const getImageDimensions = (file) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                resolve(`${img.width},${img.height}`);
              };
              img.src = URL.createObjectURL(file);
            });

          const attch_dimension = await getImageDimensions(postMedia);

          attachments.push({
            attachment: uploadResult.file, // e.g., "images/1747671180701.jpg"
            attch_name: postMedia.name,
            attch_dimension,
            thumbnail: null,
          });
        }
      }

      // Step 2: Prepare and submit post form
      const formData = new FormData();
      formData.append("type", "post");
      formData.append("question", postContent.trim());
      formData.append("comment_permission", allowComments);
      formData.append("visibility", visibility.toLowerCase());
      formData.append("incognito", "0");
      if (attachments.length > 0) {
        formData.append("attachments", JSON.stringify(attachments));
      }

      formData.append("rmv_attachments", "[]");

      const response = await fetch(
        "https://api-stage.queryloom.com/polls/add-poll",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post poll.");
      }

      const data = await response.json();
      console.log("Poll created:", data);
      navigate("/my-posts");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create poll. Please try again.");
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
        {/* Post Content */}
        <div className="p-5 pb-0">
          <label className="block font-medium text-sm mb-2">
            Write your post*
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
            rows={6}
            maxLength={1000}
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
          />
          <div className="text-xs text-right text-gray-400 mt-1">
            {postContent.length} / 1000
          </div>
        </div>

        {/* Allow Comments */}
        <div className="px-5 flex items-center space-x-3">
          <input
            type="checkbox"
            id="postAllowComments"
            checked={postAllowComments}
            onChange={() => setPostAllowComments(!postAllowComments)}
            className="w-5 h-5 text-pink-500 rounded border-gray-300 focus:ring-pink-500 bg-gray-50"
          />
          <label htmlFor="postAllowComments" className="text-sm font-medium">
            Allow Comments
          </label>
          <span className="text-sm text-gray-500">From everyone</span>
        </div>

        {/* Media + Schedule + Visibility */}
        <div className="px-5">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            {/* Upload Button */}
            <label
              htmlFor="mediaUpload"
              className="inline-flex items-center gap-2 border border-dashed border-pink-500 rounded-xl py-2 px-4 bg-gray-50 text-pink-600 cursor-pointer hover:bg-pink-50 transition"
            >
              <UploadCloud size={20} />
              <span className="font-medium text-sm">Image/Video</span>
              <input
                type="file"
                id="mediaUpload"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
              />
            </label>

            {/* Schedule Button + Public Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={toggleVisibilityDropdown}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition text-sm font-medium"
                >
                  <Globe size={16} />
                  {visibility}
                  <ChevronDown size={16} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {["Public", "Followers", "Inner circle", "Group"].map(
                      (option) => (
                        <div
                          key={option}
                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                            visibility === option
                              ? "text-pink-600 font-semibold"
                              : "text-gray-800"
                          }`}
                          onClick={() => handleVisibilityChange(option)}
                        >
                          {option}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected File */}
          {postMedia && (
            <div className="mt-2 text-sm text-gray-700">
              Selected file: {postMedia.name}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center p-5 border-t border-gray-300 sticky bottom-0 bg-white">
          <button
            type="button"
            className="bg-gray-300 text-black px-4 py-2 rounded-lg"
            onClick={handleCancel}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-pink-500 text-white px-4 py-2 rounded-lg"
          >
            Post
          </button>
        </div>
      </form>
    </>
  );
};

export default PostForm;
