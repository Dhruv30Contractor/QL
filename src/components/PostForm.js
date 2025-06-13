import { useState, useEffect } from "react";
import { UploadCloud, ChevronDown, Globe, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScheduleModal from "./ScheduleModal";

const PostForm = ({ initialData, onSuccess }) => {
  const [postContent, setPostContent] = useState(initialData?.question || "");
  const [postAllowComments, setPostAllowComments] = useState(initialData?.commentPermission || "everyone");
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [removedAttachments, setRemovedAttachments] = useState([]);

  const [visibility, setVisibility] = useState(initialData?.visibility || "Public");
  const [incognito, setIncognito] = useState(initialData?.incognito || "0");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(
    initialData?.scheduled_date ? new Date(initialData.scheduled_date) : null
  );

  const [isRepublish, setIsRepublish] = useState(initialData?.isRepublish || false);
  const [republish_poll_id, setRepublish_poll_id] = useState(initialData?.republish_poll_id || null);

  const navigate = useNavigate();

  useEffect(() => {
    if (initialData?.attachments) {
      const attachments = initialData.attachments.map(att => ({
        url: att.attachment ? `https://assets-stage.queryloom.com/${att.attachment}` : att.url,
        attch_name: att.attch_name,
        attch_dimension: att.attch_dimension,
        thumbnail: att.thumbnail,
        attachment: att.attachment,
      }));
      setExistingAttachments(attachments);
    }
  }, [initialData]);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingAttachments.length + newAttachments.length + files.length > 4) {
      alert("You can only upload up to 4 attachments");
      return;
    }
    setNewAttachments(prev => [...prev, ...files]);
  };

  const removeExistingAttachment = (index) => {
    const attachment = existingAttachments[index];
    const filePath = attachment.url.split("assets-stage.queryloom.com/").pop();
    setRemovedAttachments(prev => [...prev, { attachment: filePath }]);
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewAttachment = (index) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVisibilityDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      const attachments = [];

      // Upload new files first
      for (const file of newAttachments) {
        const mediaFormData = new FormData();
        mediaFormData.append("file", file);

        const uploadResponse = await fetch("https://api-stage.queryloom.com/file-upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: mediaFormData,
        });

        if (!uploadResponse.ok) throw new Error("Media upload failed.");

        const uploadResult = await uploadResponse.json();

        let attch_dimension = "0,0";
        if (file.type.startsWith("image/")) {
          attch_dimension = await new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(`${img.width},${img.height}`);
            img.src = URL.createObjectURL(file);
          });
        }

        attachments.push({
          attachment: uploadResult.file,
          attch_name: file.name,
          attch_dimension,
          thumbnail: null,
        });
      }

      // Republish Flow:
      if (isRepublish && republish_poll_id) {
        formData.append("republish_poll_id", republish_poll_id);
        formData.append("type", "post");
        formData.append("question", postContent.trim());
        formData.append("comment_permission", postAllowComments);
        formData.append("visibility", visibility.toLowerCase());
        formData.append("incognito", incognito);

        // Handle attachments for republish
        const allAttachments = [];
        
        // Add new attachments
        for (const file of newAttachments) {
          const mediaFormData = new FormData();
          mediaFormData.append("file", file);

          const uploadResponse = await fetch("https://api-stage.queryloom.com/file-upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: mediaFormData,
          });

          if (!uploadResponse.ok) throw new Error("Media upload failed.");
          const uploadResult = await uploadResponse.json();

          let attch_dimension = "0,0";
          if (file.type.startsWith("image/")) {
            attch_dimension = await new Promise(resolve => {
              const img = new Image();
              img.onload = () => resolve(`${img.width},${img.height}`);
              img.src = URL.createObjectURL(file);
            });
          }

          allAttachments.push({
            attachment: uploadResult.file,
            attch_name: file.name,
            attch_dimension,
            thumbnail: null,
          });
        }

        // Add existing attachments that haven't been removed
        const existingAttachmentsToKeep = existingAttachments.filter(att => 
          !removedAttachments.some(removed => removed.attachment === att.attachment)
        );

        allAttachments.push(...existingAttachmentsToKeep.map(file => {
          // Extract the attachment path from the URL
          const attachmentPath = file.url.split('assets-stage.queryloom.com/').pop();
          return {
            attachment: attachmentPath,
            attch_name: file.attch_name || file.url.split('/').pop(),
            attch_dimension: file.attch_dimension || "0,0",
            thumbnail: null,
          };
        }));

        // Only append attachments if there are any
        if (allAttachments.length > 0) {
          formData.append("attachments", JSON.stringify(allAttachments));
        }

        const url = "https://api-stage.queryloom.com/polls/add-poll";
        const response = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to republish post.");
        if (onSuccess) onSuccess();
        else navigate("/my-posts");
        return;
      }

      // Edit Flow:
      if (initialData?.isEdit) {
        formData.append("question", postContent.trim());
        formData.append("attachments", JSON.stringify(attachments));
        formData.append("rmv_attachments", JSON.stringify(removedAttachments));

        if (scheduledDate) {
          formData.append("scheduled_date", scheduledDate.toISOString().slice(0, 19).replace("T", " "));
        }

        const url = `https://api-stage.queryloom.com/polls/edit/${initialData.postId}`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to update post.");
        if (onSuccess) onSuccess();
        else navigate(scheduledDate ? "/scheduled-posts" : "/my-posts");
        return;
      }

      // New Post Flow:
      formData.append("type", "post");
      formData.append("question", postContent.trim());
      formData.append("comment_permission", postAllowComments);
      formData.append("visibility", visibility.toLowerCase());
      formData.append("incognito", incognito);
      formData.append("attachments", JSON.stringify([
        ...attachments,
        ...existingAttachments.map(file => ({
          attachment: file.attachment,
          attch_name: file.attch_name,
          attch_dimension: file.attch_dimension,
          thumbnail: file.thumbnail,
        }))
      ]));
      formData.append("rmv_attachments", "[]");

      if (scheduledDate) {
        formData.append("scheduled_date", scheduledDate.toISOString().slice(0, 19).replace("T", " "));
      }

      const response = await fetch("https://api-stage.queryloom.com/polls/add-poll", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to create post.");
      if (onSuccess) onSuccess();
      else navigate(scheduledDate ? "/scheduled-posts" : "/my-posts");

    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Failed to create post.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 w-full">

        {/* Post Content */}
        <div className="p-5 pb-0">
          <label className="block font-medium text-sm mb-2">Write your post*</label>
          <textarea
            className="w-full rounded-xl border border-gray-300 p-4 resize-none bg-gray-50"
            rows={6}
            maxLength={1000}
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
          />
          <div className="text-xs text-right text-gray-400 mt-1">{postContent.length} / 1000</div>
        </div>

        {/* Allow Comments */}
        <div className="px-5 flex flex-col">
          <label className="font-semibold text-sm mb-2 text-gray-700">Allow Comments</label>
          <select
            className="w-1/3 rounded-xl border border-gray-300 bg-gray-50 p-3 pr-8"
            value={postAllowComments}
            onChange={(e) => setPostAllowComments(e.target.value)}
          >
            <option value="everyone">From everyone</option>
            <option value="followers">Followers</option>
            <option value="mutual">Mutual</option>
            <option value="innerCircle">Inner Circle</option>
            <option value="disallow">Disallow comments</option>
          </select>
        </div>

        {/* Upload / Schedule / Visibility */}
        <div className="px-5">
          <div className="flex justify-between items-center gap-4 flex-wrap">

            {/* Upload */}
            <label htmlFor="mediaUpload" className="inline-flex items-center gap-2 border border-dashed border-pink-500 rounded-xl py-2 px-4 bg-gray-50 text-pink-600 cursor-pointer">
              <UploadCloud size={20} />
              <span className="font-medium text-sm">Image/Video</span>
              <input type="file" id="mediaUpload" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" multiple />
            </label>

            {/* Schedule */}
            <button type="button" onClick={() => setShowScheduleModal(true)} className="px-3 py-2 rounded-xl bg-pink-50 text-pink-600"
              disabled={initialData?.isPublished}
            >
              {scheduledDate ? 'Scheduled' : 'Schedule'}
            </button>

            {/* Visibility */}
            <div className="relative">
              <button type="button" onClick={toggleVisibilityDropdown} className="px-3 py-2 rounded-xl bg-pink-50 text-pink-600 flex items-center"
                disabled={initialData?.isPublished}
              >
                <Globe size={16} /> {visibility} <ChevronDown size={16} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg">
                  {["Public", "Followers", "Inner circle", "Group"].map(option => (
                    <div key={option} className={`px-4 py-2 text-sm cursor-pointer ${visibility === option ? "text-pink-600 font-semibold" : "text-gray-800"}`}
                      onClick={() => { setVisibility(option); setShowDropdown(false); }}>
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attachments Preview */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Existing Attachments */}
            {existingAttachments.map((file, index) => (
              <div key={index} className="relative group">
                <img src={file.url} alt="existing" className="w-full h-full object-cover rounded-xl" />
                <button type="button" onClick={() => removeExistingAttachment(index)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                  <X size={16} />
                </button>
              </div>
            ))}
            {/* New Attachments */}
            {newAttachments.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <video src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-xl" controls />
                )}
                <button type="button" onClick={() => removeNewAttachment(index)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Scheduled Date Preview */}
          {scheduledDate && (
            <div className="mt-2 text-sm text-gray-700">
              Scheduled for: {scheduledDate.toLocaleString()}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-between items-center p-5 border-t border-gray-300 sticky bottom-0 bg-white">
          <button type="button" className="bg-gray-300 text-black px-4 py-2 rounded-lg" onClick={() => window.history.back()}>Cancel</button>
          <button type="submit" className="bg-pink-500 text-white px-4 py-2 rounded-lg">{scheduledDate ? 'Schedule' : 'Post'}</button>
        </div>
      </form>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={(date) => { setScheduledDate(date); setShowScheduleModal(false); }}
          initialDate={scheduledDate}
        />
      )}
    </>
  );
};

export default PostForm;