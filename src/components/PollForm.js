import { useState, useEffect } from "react";
import { UploadCloud, ChevronDown, Globe, X, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScheduleModal from "./ScheduleModal";

const PollForm = ({ initialData, onSuccess }) => {
  const [pollQuestion, setPollQuestion] = useState(initialData?.question || "");
  const [options, setOptions] = useState(initialData?.options || [{ text: "" }, { text: "" }]);
  const [endDate, setEndDate] = useState(initialData?.expiration ? new Date(initialData.expiration).toISOString().split('T')[0] : null);
  const [allowComments, setAllowComments] = useState(initialData?.commentPermission || "everyone");
  const [verifiableOutcome, setVerifiableOutcome] = useState(initialData?.isOutcome ? "yes" : "no");

  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [removedAttachments, setRemovedAttachments] = useState([]);

  const [visibility, setVisibility] = useState(initialData?.visibility || "Public");
  const [incognito, setIncognito] = useState(initialData?.incognito || "0");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCommentsDropdown, setShowCommentsDropdown] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduled_date ? new Date(initialData.scheduled_date) : null);

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

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = { text: value };
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: "" }]);
    }
  };

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

  const toggleVisibilityDropdown = () => setShowDropdown(!showDropdown);

  const toggleCommentsDropdown = () => setShowCommentsDropdown(!showCommentsDropdown);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      const attachments = [];

      const trimmedOptions = options.map(opt => opt.text.trim()).filter(opt => opt !== "");
      if (trimmedOptions.length < 2) {
        throw new Error("Please add at least 2 options");
      }

      // Upload new files only
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
        formData.append("type", "poll");
        formData.append("question", pollQuestion.trim());
        formData.append("comment_permission", allowComments);
        formData.append("is_outcome", verifiableOutcome === "yes" ? "true" : "false");
        formData.append("visibility", visibility.toLowerCase());
        formData.append("incognito", incognito);
        formData.append("options", JSON.stringify(trimmedOptions));

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

        if (endDate) formData.append("end_date", `${endDate} 23:59:59`);

        const url = "https://api-stage.queryloom.com/polls/add-poll";
        const response = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to republish poll.");
        if (onSuccess) onSuccess();
        else navigate("/my-posts");
        return;
      }

      // Edit Flow:
      if (initialData?.isEdit) {
        formData.append("question", pollQuestion.trim());
        formData.append("options", JSON.stringify(trimmedOptions));
        formData.append("expiration", `${endDate} 23:59:59`);
        formData.append("attachments", JSON.stringify(attachments));
        formData.append("rmv_attachments", JSON.stringify(removedAttachments));

        if (scheduledDate) {
          formData.append("scheduled_date", scheduledDate.toISOString().slice(0, 19).replace('T', ' '));
        }

        const url = `https://api-stage.queryloom.com/polls/edit/${initialData.postId}`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to update poll.");
        if (onSuccess) onSuccess();
        else navigate(scheduledDate ? "/scheduled-posts" : "/my-posts");
        return;
      }

      // New Poll Flow:
      formData.append("type", "poll");
      formData.append("question", pollQuestion.trim());
      formData.append("comment_permission", allowComments);
      formData.append("is_outcome", verifiableOutcome === "yes" ? "true" : "false");
      formData.append("visibility", visibility.toLowerCase());
      formData.append("incognito", incognito);
      formData.append("options", JSON.stringify(trimmedOptions));

      const allAttachments = [
        ...attachments,
        ...existingAttachments.map(file => ({
          attachment: file.attachment,
          attch_name: file.attch_name,
          attch_dimension: file.attch_dimension,
          thumbnail: file.thumbnail,
        }))
      ];
      formData.append("attachments", JSON.stringify(allAttachments));
      formData.append("rmv_attachments", "[]");

      if (endDate) formData.append("end_date", `${endDate} 23:59:59`);
      if (scheduledDate) {
        formData.append("scheduled_date", scheduledDate.toISOString().slice(0, 19).replace("T", " "));
      }

      const response = await fetch("https://api-stage.queryloom.com/polls/add-poll", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to post poll.");
      if (onSuccess) onSuccess();
      else navigate(scheduledDate ? "/scheduled-posts" : "/my-posts");

    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Failed to create poll.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 w-full">

        {/* Poll Question */}
        <div className="p-5 pb-0">
          <label className="block font-medium text-sm mb-2">Your Poll Question*</label>
          <textarea
            className="w-full rounded-xl border border-gray-300 p-4 resize-none bg-gray-50"
            rows={3}
            maxLength={280}
            placeholder="Enter your question"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          <div className="text-xs text-right text-gray-400 mt-1">{pollQuestion.length} / 280</div>
        </div>

        {/* Poll Options */}
        <div className="px-5">
          <label className="block font-medium text-sm mb-2">Add Options*</label>
          {options.map((option, index) => (
            <div key={index} className="relative mb-4">
              <input
                type="text"
                maxLength={30}
                placeholder={`Option ${index + 1}`}
                className="w-full rounded-xl border border-gray-300 p-3 pr-10 bg-gray-50"
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
              <div className="text-xs text-right text-gray-400 mt-1">{option.text.length} / 30</div>
            </div>
          ))}
          {options.length < 6 && (
            <button onClick={addOption} className="text-pink-500 text-sm font-medium hover:underline" type="button">
              + Add More
            </button>
          )}
        </div>

        {/* End Date and Allow Comments Section */}
        <div className="px-5 grid grid-cols-2 gap-4">
          {/* Poll Expiration (End Date) */}
          <div>
            <label className="block font-medium text-sm mb-2">End Date*</label>
            <input
              type="date"
              className="w-full rounded-xl border border-gray-300 p-3 bg-gray-50"
              value={endDate || ""}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Allow Comments */}
          <div>
            <label className="block font-medium text-sm mb-2">Allow Comments</label>
            <select
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pr-8"
              value={allowComments}
              onChange={(e) => setAllowComments(e.target.value)}
            >
              <option value="everyone">From everyone</option>
              <option value="followers">Followers</option>
              <option value="following_and_following_back">People I follow and people who follow me</option>
              <option value="inner_circle">Inner circle</option>
              <option value="no_one">Disallow comments</option>
            </select>
          </div>
        </div>

        {/* Verifiable Outcome */}
        <div className="px-5">
          <label className="block font-medium text-sm mb-2">Question has a verifiable outcome:</label>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="verifiableOutcome"
                value="yes"
                checked={verifiableOutcome === "yes"}
                onChange={() => setVerifiableOutcome("yes")}
                className="form-radio text-pink-500"
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="verifiableOutcome"
                value="no"
                checked={verifiableOutcome === "no"}
                onChange={() => setVerifiableOutcome("no")}
                className="form-radio text-pink-500"
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>

        {/* Action Buttons Section (Photos/Videos, Schedule, Visibility) */}
        <div className="px-5">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            {/* Photos/Videos Button */}
            <label htmlFor="mediaUpload" className="inline-flex items-center gap-2 border border-dashed border-pink-500 rounded-xl py-2 px-4 bg-gray-50 text-pink-600 cursor-pointer">
              <UploadCloud size={20} />
              <span className="font-medium text-sm">Photos/Videos</span>
              <input type="file" id="mediaUpload" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" multiple />
            </label>

            {/* Schedule Button */}
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="px-3 py-2 rounded-xl bg-pink-50 text-pink-600"
              disabled={initialData?.isPublished}
            >
              {scheduledDate ? 'Scheduled' : 'Now'}
            </button>

            {/* Visibility Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleVisibilityDropdown}
                className="px-3 py-2 rounded-xl bg-pink-50 text-pink-600 flex items-center"
                disabled={initialData?.isPublished}
              >
                <Globe size={16} /> {visibility} <ChevronDown size={16} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg">
                  <button
                    type="button"
                    onClick={() => { setVisibility("Public"); setShowDropdown(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVisibility("Followers"); setShowDropdown(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Followers
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVisibility("Inner circle"); setShowDropdown(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Inner circle
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVisibility("Group"); setShowDropdown(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Group
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Attachment Previews */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {existingAttachments.map((file, index) => (
              <div key={index} className="relative group">
                <img src={file.url} alt="existing" className="w-full h-full object-cover rounded-xl" />
                <button type="button" onClick={() => removeExistingAttachment(index)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                  <X size={16} />
                </button>
              </div>
            ))}
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

export default PollForm;