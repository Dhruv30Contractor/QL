import { useState, useEffect } from "react";
import { Smile, UploadCloud, Clock, Globe, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScheduleModal from "./ScheduleModal";

const PostForm = ({ initialData, onSuccess }) => {
  const [postContent, setPostContent] = useState(initialData?.question || "");
  const [postAllowComments, setPostAllowComments] = useState(initialData?.commentPermission || "everyone");
  const [postMedia, setPostMedia] = useState([]);
  const [visibility, setVisibility] = useState(initialData?.visibility || "Public");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduled_date ? new Date(initialData.scheduled_date) : null);
  const [isRepublish, setIsRepublish] = useState(false);
  const [republish_poll_id, setRepublish_poll_id] = useState(null);
  const [removedAttachments, setRemovedAttachments] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (initialData) {
      setPostContent(initialData.question || "");
      setPostAllowComments(initialData.commentPermission || "everyone");
      setVisibility(initialData.visibility || "Public");
      setScheduledDate(initialData.scheduled_date ? new Date(initialData.scheduled_date) : null);
      setIsRepublish(initialData.isRepublish || false);
      setRepublish_poll_id(initialData.republish_poll_id || null);

      if (initialData.attachments) {
        // **MODIFICATION HERE:**  Map over the initial attachments to extract filename.
        const formattedAttachments = initialData.attachments.map(attachment => ({
          ...attachment, // Keep existing properties (url, attch_dimension etc.)
          attch_name: attachment.attch_name || (attachment.attachment ? attachment.attachment.split('/').pop() : 'unknown') // Extract filename from the URL if attch_name is missing

        }));

        setPostMedia(formattedAttachments);
        setRemovedAttachments([]);
      }
    }
  }, [initialData]);

  // Handle file selection
  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (postMedia.length + files.length > 4) {
      alert("You can only upload up to 4 attachments");
      return;
    }
    setPostMedia(prev => [...prev, ...files]);
  };

  // Remove a specific attachment
    // Remove a specific attachment
    const removeAttachment = (index) => {
      const attachment = postMedia[index];
      if (attachment.url) {  // Only track removal of existing attachments
        const filePath = attachment.url.split('assets-stage.queryloom.com/').pop();
  
        setRemovedAttachments(prev => [
          ...prev,
          {
            attachment: filePath,
            attch_name: attachment.attch_name || filePath.split('/').pop() , // Use existing attch_name or extract from path
            attch_dimension: attachment.attch_dimension || "0,0", // Assuming you have or can get dimension here
            thumbnail: null,
          },
        ]);
      }
      setPostMedia(prev => prev.filter((_, i) => i !== index));
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
    try {
      const formData = new FormData();
      const attachments = [];
      let hasNewAttachments = false;

      // Upload each media file and collect attachment data
      for (const file of postMedia) {
        if (file instanceof File) {  // Only upload new files
          hasNewAttachments = true;
          const mediaFormData = new FormData();
          mediaFormData.append("file", file);

          const uploadResponse = await fetch(
            "https://api-stage.queryloom.com/file-upload",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: mediaFormData,
            }
          );

          if (!uploadResponse.ok) {
            throw new Error("Media upload failed.");
          }

          const uploadResult = await uploadResponse.json();

          if (uploadResult?.file) {
            // Get image dimensions for images
            let attch_dimension = null;
            if (file.type.startsWith('image/')) {
              attch_dimension = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                  resolve(`${img.width},${img.height}`);
                };
                img.src = URL.createObjectURL(file);
              });
            }

            attachments.push({
              attachment: uploadResult.file,
              attch_name: file.name,
              attch_dimension: attch_dimension || "0,0",
              thumbnail: null,
            });
          }
        } else if (file.url) {  // Keep existing attachments that weren't removed
          // Get dimensions for existing images
          let attch_dimension = "0,0";
          if (file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            try {
              attch_dimension = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                  resolve(`${img.width},${img.height}`);
                };
                img.onerror = () => resolve("0,0");
                img.src = file.url;
              });
            } catch (error) {
              console.error("Error getting image dimensions:", error);
              attch_dimension = "0,0";
            }
          }

          // Extract the file path from the URL
          const filePath = file.url.split('assets-stage.queryloom.com/').pop();

          attachments.push({
            attachment: filePath,
            attch_name: file.attch_name,
            attch_dimension: attch_dimension,
            thumbnail: null,
          });
        }
      }

      if (isRepublish && republish_poll_id) {
        // First, delete the old post
        const deleteResponse = await fetch(`https://api-stage.queryloom.com/polls/edit/${republish_poll_id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ del: 1 })
        });

        if (!deleteResponse.ok) {
          throw new Error("Failed to delete old post");
        }

        // Then create the new post
        formData.append('republish_poll_id', republish_poll_id);
        formData.append("type", "post");
        formData.append("question", postContent.trim());
        formData.append("comment_permission", postAllowComments);
        formData.append("visibility", visibility.toLowerCase());
        formData.append("incognito", "0");
        formData.append("attachments", JSON.stringify(attachments));
        formData.append("rmv_attachments", JSON.stringify(removedAttachments));

        const url = "https://api-stage.queryloom.com/polls/add-poll";
        const method = "POST";

        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to republish post.");
        }

        const data = await response.json();
        console.log("Republish Post response:", data);

        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/my-posts");
        }
        return;
      }

      if (initialData?.isEdit) {
        formData.append("question", postContent.trim());
        formData.append("attachments", JSON.stringify(hasNewAttachments ? attachments : []));
        formData.append("rmv_attachments", JSON.stringify(removedAttachments));
      } else {
        formData.append("type", "post");
        formData.append("question", postContent.trim());
        formData.append("comment_permission", postAllowComments);
        formData.append("visibility", visibility.toLowerCase());
        formData.append("incognito", "0");
        formData.append("attachments", JSON.stringify(attachments));
        formData.append("rmv_attachments", "[]");

        if (scheduledDate) {
          formData.append("scheduled_date", scheduledDate.toISOString().slice(0, 19).replace('T', ' '));
        }
      }

      const url = initialData?.isEdit 
        ? `https://api-stage.queryloom.com/polls/edit/${initialData.postId}`
        : "https://api-stage.queryloom.com/polls/add-poll";

      const method = initialData?.isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post.");
      }

      const data = await response.json();
      console.log("Post response:", data);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/my-posts");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Failed to create post. Please try again.");
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
        <div className="px-5 flex flex-col">
          <label className="font-semibold text-sm mb-2 text-gray-700">
            Allow Comments
          </label>
          <select
            className="w-1/3 rounded-xl border border-gray-300 bg-gray-50 p-3 pr-8 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-shadow"
            value={postAllowComments}
            onChange={(e) => setPostAllowComments(e.target.value)}
          >
            <option value="everyone" className="text-pink-600 font-semibold">
              From everyone
            </option>
            <option value="followers" className="hover:bg-gray-100">
              Followers
            </option>
            <option value="mutual" className="hover:bg-gray-100">
              People I follow and people who follow me
            </option>
            <option value="innerCircle" className="hover:bg-gray-100">
              Inner circle
            </option>
            <option value="disallow" className="hover:bg-gray-100">
              Disallow comments
            </option>
          </select>
        </div>

        {/* Media + Schedule + Visibility */}
        <div className="px-5">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            {/* Upload Button */}
            <label
              htmlFor="mediaUpload"
              className={`inline-flex items-center gap-2 border border-dashed border-pink-500 rounded-xl py-2 px-4 bg-gray-50 text-pink-600 cursor-pointer hover:bg-pink-50 transition ${
                postMedia.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <UploadCloud size={20} />
              <span className="font-medium text-sm">Image/Video</span>
              <input
                type="file"
                id="mediaUpload"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
                disabled={postMedia.length >= 4}
                multiple
              />
            </label>

            {/* Schedule Button */}
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition text-sm font-medium"
            >
              <Clock size={16} />
              {scheduledDate ? 'Scheduled' : 'Schedule'}
            </button>

            {/* Visibility Dropdown */}
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

          {/* Selected Files */}
          {postMedia.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {postMedia.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    {file instanceof File ? (
                      file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`attachment-${index}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={URL.createObjectURL(file)}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <img
                        src={file.url}
                        alt={`attachment-${index}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Scheduled Date Display */}
          {scheduledDate && (
            <div className="mt-2 text-sm text-gray-700">
              Scheduled for: {scheduledDate.toLocaleString()}
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
            {scheduledDate ? 'Schedule' : 'Post'}
          </button>
        </div>
      </form>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={(date) => {
            setScheduledDate(date);
            setShowScheduleModal(false);
          }}
          initialDate={scheduledDate}
        />
      )}
    </>
  );
};

export default PostForm;