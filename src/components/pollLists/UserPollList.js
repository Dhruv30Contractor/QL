// components/UserProfile.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../config";
import PostCard from "../PostCard";
import { useLocation } from "react-router-dom";
import EditProfileModal from "./EditProfileModal";
import {
    ArrowLeft,
    Users,
    UserPlus,
    LayoutDashboard,
    Circle,
    UsersRound,
    UserCircle2,
} from "lucide-react";
import PostModal from "../PostModal";

export default function UserProfile() {
    const [profile, setProfile] = useState(null);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);

    const location = useLocation();
    const userId = location.state?.userId || null;

    // Parse localStorage to check if user is viewing their own profile
    const ownProfile = localStorage.getItem("user");
    const ownProfileId = ownProfile ? JSON.parse(ownProfile).id : null;
    const isOwnProfile = ownProfileId === userId;

    const handleProfileUpdate = (updatedProfile) => {
      setProfile(updatedProfile);
  };

    useEffect(() => {
        async function fetchData() {
            try {
                // console.log("Fetching profile for userId:", userId);
                const profileRes = await axios.get(
                    `${BASE_URL}/user/profile/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        params: { type: "profile" },
                    }
                );

                console.log("Fetching polls for userId:", userId, "isOwnProfile:", isOwnProfile);
                const pollsRes = await axios.post(
                    `${BASE_URL}/polls/get-polls`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        params: {
                            page: 1,
                            limit: 10,
                            category: "posted",
                            ...(isOwnProfile ? {} : { forProfile: userId }),
                            include_unpublished: isOwnProfile
                        }
                    }
                );

                setProfile(profileRes.data);
                // Filter out scheduled posts from the user profile
                const filteredPolls = pollsRes.data.filter(poll => poll.scheduled !== 1);
                setPolls(filteredPolls);
                console.log("Fetched polls:", filteredPolls);
            } catch (err) {
                console.error("Error fetching user profile or polls:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [userId, isOwnProfile]);

    const profileStats = [
        {
            label: "Followers",
            value: profile?.followers || 0,
            icon: <Users className="h-6 w-6 stroke-[1.5] text-gray-500" />,
        },
        {
            label: "Following",
            value: profile?.following || 0,
            icon: <UserPlus className="h-6 w-6 stroke-[1.5] text-gray-500" />,
        },
        {
            label: "Number of Posts",
            value: profile?.publicPolls || 0,
            icon: <LayoutDashboard className="h-6 w-6 stroke-[1.5] text-gray-500" />,
        },
    ];

    // Append extra stats if this is the user's own profile
    if (isOwnProfile) {
        profileStats.push(
            {
                label: "Inner Circle",
                value: profile?.in_inner_circle || 0,
                icon: <Circle className="h-6 w-6 stroke-[1.5] text-gray-500" />,
            },
            {
                label: "Groups Joined",
                value: profile?.joined_groups || 0,
                icon: <UsersRound className="h-6 w-6 stroke-[1.5] text-gray-500" />,
            },
            {
                label: "Groups Created",
                value: profile?.created_groups || 0,
                icon: <UserCircle2 className="h-6 w-6 stroke-[1.5] text-gray-500" />,
            }
        );
    }

    const [isFollowing, setIsFollowing] = useState(profile?.youFollow === 1);

    const handleDelete = (postId) => {
      setPolls((prev) => prev.filter((p) => p.id !== postId));
    };

    const handleUpdate = (updatedPost) => {
      setPolls((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    };
    
    const handleFollowToggle = async () => {
        setFollowLoading(true);

        const action = isFollowing ? "unfl" : "fl";
        const url = `${BASE_URL}/user/manage-follow?user_id=${userId}&type=${action}`;

        try {
            await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setIsFollowing(!isFollowing);
        } catch (error) {
            console.error("Follow/unfollow failed:", error);
        } finally {
            setFollowLoading(false);
        }
    };

    useEffect(() => {
        setIsFollowing(profile?.youFollow === 1);
    }, [profile?.youFollow]);
    const openEditProfileModal = () => {
        setIsEditProfileModalOpen(true);
    };

    const closeEditProfileModal = () => {
        setIsEditProfileModalOpen(false);
    };

    const handlePostUnsave = (postId) => {
      // Remove the post from the list if it was unsaved
      setPolls(prevPolls => prevPolls.filter(poll => poll.id !== postId));
    };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!profile) return <div className="text-center py-10">User not found.</div>;

  return (
    <div className="flex flex-col m-5 mb-0 rounded-xl space-y-5 h-screen overflow-y-auto no-scrollbar bg-white">
      {/* Header */}
      <h2 className="text-lg font-semibold p-4 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-black transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-pink-600" />
        </button>
        {profile.user_name}
            {/* Edit Profile Button (Visible for Own Profile) */}
             {isOwnProfile && (
               <button
                 onClick={openEditProfileModal}
                className="ml-auto px-4 py-2 bg-pink-100 text-pink-600 rounded-full text-sm font-medium hover:bg-pink-200 transition"
              >
               Edit Profile
              </button>
            )}
      </h2>

      <div className="flex flex-col px-5">
        {/* Banner */}
        <div
          className={`relative h-64 w-full rounded-xl shadow-inner border border-gray-200 ${
            profile.banner ? "" : "bg-gradient-to-br from-gray-100 to-gray-300"
          }`}
          style={
            profile.banner
              ? {
                  backgroundImage: `url(https://assets-stage.queryloom.com/${profile.banner})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {}
          }
        >
          <div className="absolute -bottom-14 left-6">
            <img
              src={
                profile.profile
                  ? `https://assets-stage.queryloom.com/${profile.profile}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile.user_name
                    )}`
              }
              alt="Profile"
              className="w-20 h-20 rounded-xl shadow-md object-cover"
            />
          </div>

          <div className="absolute -bottom-12 left-28 pl-2">
            <h3 className="font-semibold">{profile.name}</h3>
            <p className="text-sm font-semibold text-gray-600">@{profile.user_name}</p>
          </div>
        </div>

        <div className="mt-20 pb-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Left Content */}
          <div className="flex-1">
            <p className="mt-2 text-gray-700">{profile.bio}</p>

            {/* Search & Sort */}
            <div className="mt-6 flex gap-2 items-center">
              <input
                type="text"
                placeholder="Search posts..."
                className="flex-1 px-4 py-2 border rounded-xl bg-white shadow-sm text-sm"
              />
              <select className="px-4 py-2 border rounded-xl bg-white shadow-sm text-sm">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {/* Polls */}
            <div className="mt-6 space-y-4">
              {polls.map((poll) => (
                <PostCard 
                  key={poll.id} 
                  post={poll} 
                  onOpenModal={setSelectedPostId}
                  onUnsave={handlePostUnsave}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-4">
            {!isOwnProfile && (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`w-full py-2 rounded-xl font-semibold transition duration-200 bg-white border-2 text-rose-500 border-rose-500 hover:bg-rose-50 ${
                  followLoading
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-rose-50"
                }`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
            <div className="bg-orange-50 border border-orange-300 p-4 rounded-xl text-sm shadow space-y-3">
              {profileStats.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-start gap-4"
                >
                  <div className="flex items-center gap-2 text-gray-600">
                    {item.icon}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-600 font-medium">
                      {item.label}
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
             {/* Conditionally Render EditProfileModal */}
             {isEditProfileModalOpen && (
               <EditProfileModal
                 profile={profile}
                 onClose={closeEditProfileModal}
                 onProfileUpdate={handleProfileUpdate}
               />
             )}
             {/* Render PostModal when a post is selected */}
             {selectedPostId && (
               <PostModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
             )}
    </div>
  );
}