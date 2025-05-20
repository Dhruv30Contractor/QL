import { useState } from "react";
import { Smile, UploadCloud, Clock, Globe, ChevronDown } from "lucide-react";
import ScheduleModal from "./ScheduleModal"; // import the modal component

const PostForm = ({ onPost }) => {
  const [postContent, setPostContent] = useState("");
  const [postAllowComments, setPostAllowComments] = useState(true);
  const [postMedia, setPostMedia] = useState(null);

  const [visibility, setVisibility] = useState("Public");
  const [showDropdown, setShowDropdown] = useState(false);

  // For schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(null); // store full datetime string

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

  // Open schedule modal
  const openScheduleModal = (e) => {
    e.preventDefault();
    setShowScheduleModal(true);
  };

  // Close schedule modal
  const closeScheduleModal = () => {
    setShowScheduleModal(false);
  };

  // Save scheduled date/time from modal
  const handleScheduleSave = (date, time) => {
    if (date && time) {
      // Combine date and time into a single ISO string
      const combinedDateTime = new Date(`${date}T${time}`);
      setScheduledDate(combinedDateTime.toISOString());
    } else {
      setScheduledDate(null);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("postContent", postContent);
    formData.append("postAllowComments", postAllowComments);
    formData.append("visibility", visibility);
    if (postMedia) {
      formData.append("postMedia", postMedia);
    }
    if (scheduledDate) {
      formData.append("scheduledDate", scheduledDate); // append scheduled datetime
    }

    if (onPost) {
      onPost(formData);
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
              <button
                onClick={openScheduleModal}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition text-sm font-medium"
              >
                <Clock size={16} />
                Schedule
              </button>

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

          {/* Show Scheduled Date/Time */}
          {scheduledDate && (
            <div className="mt-2 text-sm text-pink-600 font-medium">
              Scheduled for: {new Date(scheduledDate).toLocaleString()}
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

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={closeScheduleModal}
        onSave={handleScheduleSave}
      />
    </>
  );
};

export default PostForm;
