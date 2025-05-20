import { useState } from "react";
import { ArrowLeft, BarChart2, Edit3, Info } from "lucide-react";
import PollForm from "../components/PollForm";
import PostForm from "../components/PostForm";
// import ScheduleModal from "../components/ScheduleModal"; // ⬅️ import modal

const CreatePost = () => {
  const [activeTab, setActiveTab] = useState("poll");
  const [isIncognito, setIsIncognito] = useState(false);
  // const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const handleIncognitoToggle = () => {
    setIsIncognito(!isIncognito);
  };

  return (
    <div className="w-full no-scrollbar h-full">
      {/* Header */}
      <h2 className="text-lg font-semibold p-4 bg-white sticky top-0 z-20 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-black transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-pink-600" />
        </button>
        Create Post
      </h2>

      {/* Post Card */}
      <div className="bg-white m-7 rounded-2xl shadow-xl w-full max-w-3xl mx-auto overflow-y-auto overflow-x-hidden max-h-[75vh] no-scrollbar">
        {/* Tabs */}
        <div className="flex items-center border-b p-5 py-0 sticky top-0 bg-white z-10">
          <button
            onClick={() => setActiveTab("poll")}
            className={`flex items-center gap-1 text-sm font-medium py-5 border-b-2 ${
              activeTab === "poll"
                ? "text-pink-600 border-pink-600"
                : "text-gray-500 border-transparent"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Create Poll
          </button>

          <button
            onClick={() => setActiveTab("post")}
            className={`flex items-center gap-1 text-sm font-medium px-4 py-5 border-b-2 ${
              activeTab === "post"
                ? "text-pink-600 border-pink-600"
                : "text-gray-500 border-transparent"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Create Post
          </button>

          {/* Right Section: Incognito + Schedule */}
          {/* <div className="ml-auto flex items-center gap-3 text-sm text-gray-600">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-pink-100 text-pink-600 px-3 py-1 rounded-lg text-xs hover:bg-pink-200 transition"
            >
              Schedule
            </button>

            <div className="flex items-center gap-1">
              <span>Post As Incognito</span>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-100">
                  You will post as an anonymous person
                </div>
              </div>

              <label className="inline-flex items-center ml-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isIncognito}
                  onChange={handleIncognitoToggle}
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-pink-500 transition duration-300 relative">
                  <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full peer-checked:translate-x-5 transition"></div>
                </div>
              </label>
            </div>
          </div>
           */}
        </div>

        {/* Form */}
        <div className="space-y-8 w-full">
          {activeTab === "poll" ? <PollForm /> : <PostForm />}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
