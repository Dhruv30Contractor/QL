import { useState } from "react";
import { Smile, UploadCloud, Clock, Globe, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PollForm = () => {
  const [pollQuestion, setPollQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [endDate, setEndDate] = useState("");
  const [allowComments, setAllowComments] = useState("everyone");
  const [verifiableOutcome, setVerifiableOutcome] = useState("yes");
  const [postMedia, setPostMedia] = useState(null);
  const navigate = useNavigate();

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (!pollQuestion.trim() || trimmedOptions.length < 2 || !endDate) {
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

      // Step 2: Prepare and submit poll form
      const formData = new FormData();
      formData.append("type", "poll");
      formData.append("question", pollQuestion.trim());
      formData.append("comment_permission", allowComments);
      formData.append(
        "is_outcome",
        verifiableOutcome === "yes" ? "true" : "false"
      );
      formData.append("visibility", visibility.toLowerCase());
      formData.append("incognito", "0");

      const formattedEndDate = `${endDate} 23:59:59`;
      formData.append("end_date", formattedEndDate);

      formData.append("options", JSON.stringify(trimmedOptions));

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
  const [visibility, setVisibility] = useState("Public");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleMediaChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPostMedia(e.target.files[0]);
    }
  };

  const toggleVisibilityDropdown = () => setShowDropdown(!showDropdown);

  const handleVisibilityChange = (option) => {
    setVisibility(option);
    setShowDropdown(false);
  };

  // const openScheduleModal = () => {
  //   // open modal to pick date + time
  // };

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
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
            />
            <Smile className="absolute right-3 top-3 text-gray-400" size={18} />
            <div className="text-xs text-right text-gray-400 mt-1">
              {option.length} / 30
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

          {/* Right-side buttons: Schedule + Public */}
          <div className="flex items-center gap-2">
            {/* Schedule Button */}
            <button
              // onClick={openScheduleModal}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition text-sm font-medium"
            >
              <Clock size={16} />
              Schedule
            </button>

            {/* Public Dropdown */}
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
  );
};

export default PollForm;
