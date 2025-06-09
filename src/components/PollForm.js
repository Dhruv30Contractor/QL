import { useState, useEffect } from "react";
import { Smile, UploadCloud, Clock, Globe, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScheduleModal from "./ScheduleModal";

const PollForm = ({ initialData, onSuccess }) => {
  const [pollQuestion, setPollQuestion] = useState(initialData?.question || "");
  const [options, setOptions] = useState(initialData?.options || [{ text: "" }, { text: "" }]);
  const [endDate, setEndDate] = useState(
    initialData?.expiration ? new Date(initialData.expiration).toISOString().split('T')[0] : null
  );
  const [allowComments, setAllowComments] = useState(initialData?.commentPermission || "everyone");
  const [verifiableOutcome, setVerifiableOutcome] = useState(initialData?.isOutcome ? "yes" : "no");
  const [postMedia, setPostMedia] = useState([]);
  const [visibility, setVisibility] = useState(initialData?.visibility || "Public");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(
    initialData?.scheduled_date ? new Date(initialData.scheduled_date) : null
  );
  const [isRepublish, setIsRepublish] = useState(false);
  const [republish_poll_id, setRepublish_poll_id] = useState(null);
  const [removedAttachments, setRemovedAttachments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialData) {
      setPollQuestion(initialData.question || "");
      setOptions(initialData.options || [{ text: "" }, { text: "" }]);
      setEndDate(initialData.expiration ? new Date(initialData.expiration).toISOString().split('T')[0] : null);
      setAllowComments(initialData.commentPermission || "everyone");
      setVerifiableOutcome(initialData.isOutcome ? "yes" : "no");
      setVisibility(initialData.visibility || "Public");
      setScheduledDate(initialData.scheduled_date ? new Date(initialData.scheduled_date) : null);
      setIsRepublish(initialData.isRepublish || false);
      setRepublish_poll_id(initialData.republish_poll_id || null);
      if (initialData.attachments) {
        setPostMedia(initialData.attachments);
        setRemovedAttachments([]);
      }
    }
  }, [initialData]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = { text: value };
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: "" }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      const trimmedOptions = options.map(opt => opt.text.trim()).filter(opt => opt !== "");
      const attachments = [];
      let hasNewAttachments = false;
      
      if (trimmedOptions.length < 2) {
        throw new Error("Please add at least 2 options");
      }

      for (const file of postMedia) {
        if (file instanceof File) {
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
        } else if (file.url) {
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

          const filePath = file.url.split('assets-stage.queryloom.com/').pop();

          attachments.push({
            attachment: filePath,
            attch_name: filePath.split('/').pop(),
            attch_dimension: attch_dimension,
            thumbnail: null,
          });
        }
      }

      if (isRepublish && republish_poll_id) {
        const deleteResponse = await fetch(`https://api-stage.queryloom.com/polls/edit/${republish_poll_id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ del: 1 })
        });

        if (!deleteResponse.ok) {
          throw new Error("Failed to delete old poll");
        }

        formData.append('republish_poll_id', republish_poll_id);
        if (endDate) {
          formData.append('end_date', `${endDate} 23:59:59`);
        }
        formData.append("type", "poll");
        formData.append("question", pollQuestion.trim());
        formData.append("comment_permission", allowComments);
        formData.append("is_outcome", verifiableOutcome === "yes" ? "true" : "false");
        formData.append("visibility", visibility.toLowerCase());
        formData.append("incognito", "0");
        formData.append("options", JSON.stringify(trimmedOptions));
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
          throw new Error(errorData.message || "Failed to republish poll.");
        }

        const data = await response.json();
        console.log("Republish Poll response:", data);

        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/my-posts");
        }
        return;
      }

      if (initialData?.isEdit) {
        formData.append("question", pollQuestion.trim());
        formData.append("options", JSON.stringify(trimmedOptions));
        formData.append("expiration", `${endDate} 23:59:59`);
        formData.append("attachments", JSON.stringify(hasNewAttachments ? attachments : []));
        formData.append("rmv_attachments", JSON.stringify(removedAttachments));
        
        if (initialData.scheduled) {
          if (scheduledDate) {
            formData.append("scheduled_date", scheduledDate.toISOString().slice(0, 19).replace('T', ' '));
          } else {
            formData.append("scheduled_date", null);
          }
        }
      } else {
        formData.append("type", "poll");
        formData.append("question", pollQuestion.trim());
        formData.append("comment_permission", allowComments);
        formData.append("is_outcome", verifiableOutcome === "yes" ? "true" : "false");
        formData.append("visibility", visibility.toLowerCase());
        formData.append("incognito", "0");
        formData.append("options", JSON.stringify(trimmedOptions));
        formData.append("attachments", JSON.stringify(attachments));
        formData.append("rmv_attachments", "[]");

        if (endDate) {
          formData.append('end_date', `${endDate} 23:59:59`);
        }

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
        throw new Error(errorData.message || "Failed to post poll.");
      }

      const data = await response.json();
      console.log("Poll response:", data);
      
      if (onSuccess) {
        onSuccess();
      } else {
        if (scheduledDate) {
          navigate("/scheduled-posts");
        } else {
          navigate("/my-posts");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Failed to create poll. Please try again.");
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (postMedia.length + files.length > 4) {
      alert("You can only upload up to 4 attachments");
      return;
    }
    setPostMedia(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    const attachment = postMedia[index];
    if (attachment.url) {
      setRemovedAttachments(prev => [...prev, attachment.url]);
    }
    setPostMedia(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVisibilityDropdown = () => setShowDropdown(!showDropdown);

  const handleVisibilityChange = (option) => {
    setVisibility(option);
    setShowDropdown(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {/* Poll Question */}
      <div className="p-5 pb-0">
        <label className="block font-medium text-sm mb-2">
          Your Poll Question*
        </label>
        <div className="relative">
          <textarea
            className="w-full rounded-xl border border-gray-300 p-4 pr-10 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
            rows={3}
            maxLength={280}
            placeholder="Enter your question"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          <Smile className="absolute right-3 top-3 text-gray-400" size={20} />
          <div className="text-xs text-right text-gray-400 mt-1">
            {pollQuestion.length} / 280
          </div>
        </div>
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
              className="w-full rounded-xl border border-gray-300 p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
              value={option.text}
              onChange={(e) => handleOptionChange(index, e.target.value)}
            />
            <Smile className="absolute right-3 top-3 text-gray-400" size={18} />
            <div className="text-xs text-right text-gray-400 mt-1">
              {option.text.length} / 30
            </div>
          </div>
        ))}
        {options.length < 6 && (
          <button
            onClick={addOption}
            className="text-pink-500 text-sm font-medium hover:underline"
            type="button"
          >
            + Add More
          </button>
        )}
      </div>

      <div className="flex justify-between gap-5 px-5 items-center">
        {/* End Date */}
        <div className="flex flex-col flex-1">
          <label className="font-medium text-sm mb-1">End Date*</label>
          <input
            type="date"
            className="w-full rounded-xl border border-gray-300 p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            placeholder="Choose End Date"
          />
        </div>

        {/* Allow Comments */}
        <div className="flex flex-col flex-1">
          <label className="font-semibold text-sm mb-2 text-gray-700">
            Allow Comments
          </label>
          <select
            className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pr-8 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-shadow"
            value={allowComments}
            onChange={(e) => setAllowComments(e.target.value)}
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
      </div>

      {/* Verifiable Outcome */}
      <div className="px-5">
        <label className="block font-medium text-sm mb-2">
          Question has a verifiable outcome:
        </label>
        <div className="flex gap-6">
          {["yes", "no"].map((val) => (
            <label
              key={val}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="radio"
                name="verifiableOutcome"
                value={val}
                checked={verifiableOutcome === val}
                onChange={() => setVerifiableOutcome(val)}
                className="w-5 h-5 text-pink-500 border-gray-300 focus:ring-pink-500 bg-gray-50"
              />
              <span>{val.charAt(0).toUpperCase() + val.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

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

          {/* Right-side buttons: Schedule + Public */}
          <div className="flex items-center gap-2">
            {/* Schedule Button */}
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${
                scheduledDate ? 'bg-pink-100 text-pink-700' : 'bg-pink-50 text-pink-600'
              } hover:bg-pink-100 transition text-sm font-medium`}
            >
              <Clock size={16} />
              {scheduledDate ? 'Scheduled' : 'Schedule'}
            </button>

            {/* Public Dropdown */}
            <div className="relative">
              <button
                type="button"
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
  );
};

export default PollForm;
