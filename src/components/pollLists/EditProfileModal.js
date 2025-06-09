import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { X } from "lucide-react";
import axios from "axios";

const EditProfileModal = ({ profile, onClose, onProfileUpdate }) => {
    const token = localStorage.getItem("token");

    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        phone: "",
        email: "",
        dob: null,
        gender: "",
        relationshipStatus: "",
        politicalAffiliation: "",
        race: "",
        annualIncome: "",
        areaOfExpertise: "",
        education: "",
        country: "",
        state: "",
        city: "",
        zipcode: "",
        bio: "",
    });

    const [options, setOptions] = useState({
        relationshipStatuses: [],
        politicalAffiliations: [],
        races: [],
        annualIncomes: [],
        areasOfExpertise: [],
        educations: [],
        countries: [],
        states: [],
        cities: [],
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [isUpdated, setIsUpdated] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const profileResponse = await axios.get(`${BASE_URL}/user/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (profileResponse.data && profileResponse.data.status && profileResponse.data.data) {
                    const userData = profileResponse.data.data;
                    console.log("Fetched user data for form population:", userData);
                    setFormData({
                        fullName: userData?.name || "",
                        username: userData?.user_name || "",
                        phone: userData?.phone || "",
                        email: userData?.email || "",
                        dob: userData?.birthdate ? new Date(userData.birthdate) : null,
                        gender: userData?.gender || "",
                        relationshipStatus: userData?.relationship_status || "",
                        politicalAffiliation: userData?.political_affiliation || "",
                        race: userData?.race || "",
                        annualIncome: userData?.annual_income || "",
                        areaOfExpertise: userData?.expertise_id || "",
                        education: userData?.education || "",
                        country: userData?.country || "",
                        state: userData?.state || "",
                        city: userData?.city || "",
                        zipcode: userData?.zipcode || "",
                        bio: userData?.bio || "",
                    });
                    console.log("formData after population:", formData);
                } else {
                    console.error("Failed to fetch user profile data:", profileResponse.data);
                    alert("Failed to load profile data.");
                }

                const fetchDropdownData = async (endpoint, key) => {
                    try {
                        const response = await fetch(`${BASE_URL}${endpoint}`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to fetch ${key}`);
                        }

                        const data = await response.json();

                        if (key === "annualIncomes") {
                            // Transform the data for annual incomes to match descriptive text
                            if (data?.status && Array.isArray(data.data)) {
                                const incomeDescriptions = [
                                    "Getting by with Support",
                                    "Meeting Essentials",
                                    "Financially Stable",
                                    "Comfortably Established",
                                    "Financially Thriving",
                                    "Prosperous and Expanding",
                                    "Ultra Wealthy",
                                ];
                                const annualIncomes = data.data.map((income, index) => ({
                                    // Assuming data.data is an array of income range strings matching the order of descriptions
                                    id: income, // Use the income string as the value sent to backend
                                    name: incomeDescriptions[index] || income, // Use description if available, otherwise fallback to income string
                                }));
                                console.log("Transformed annualIncomes:", annualIncomes);
                                setOptions((prev) => ({ ...prev, [key]: annualIncomes }));
                            } else {
                                console.error(`Failed to fetch ${key}: Invalid data format`, data);
                            }
                        } else {
                            // Original data handling for other fields
                            if (data?.status && Array.isArray(data.data)) {
                                setOptions((prev) => ({ ...prev, [key]: data.data }));
                            } else {
                                console.error(`Failed to fetch ${key}: Invalid data format`, data);
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to fetch ${key}:`, error);
                    }
                };

                await fetchDropdownData("/public/relationship-status?poll_id=8&type=data", "relationshipStatuses");
                await fetchDropdownData("/public/poll-affiliations?poll_id=8&type=data", "politicalAffiliations");
                await fetchDropdownData("/public/races?poll_id=8&type=history", "races");
                await fetchDropdownData("/public/annual-income", "annualIncomes");
                await fetchDropdownData("/public/expertise?poll_id=8&type=history", "areasOfExpertise");
                await fetchDropdownData("/public/education?poll_id=8&type=history", "educations");

            } catch (err) {
                console.error("Error fetching data for edit profile modal:", err);
                alert("An error occurred while loading data for the profile.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchData();
        } else {
            console.warn("No token found, cannot fetch profile data.");
            setLoading(false);
            alert("Please log in to edit your profile.");
            onClose();
        }
    }, [token, onClose]);

    const validate = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required.";
        if (!formData.username.trim()) newErrors.username = "Username is required.";
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setErrors({ ...errors, [name]: "" }); // Clear error for this field

        if (name === "annualIncome") {
            // Find the selected annual income object to get its ID (the income range string)
            const selectedOption = options.annualIncomes.find(opt => opt.name === value);
            if (selectedOption) {
                setFormData({ ...formData, [name]: selectedOption.id }); // Use the id (income range) as the value
            }
        } else if (name === "areaOfExpertise") {
             // Find the selected expertise object to get its ID
             const selectedOption = options.areasOfExpertise.find(opt => opt.name === value);
             if (selectedOption) {
                 setFormData({ ...formData, [name]: selectedOption.id }); // Use the id (expertise ID) as the value
             }
        } else {
            // For other fields, use the value directly
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        if (isUpdated) {
            return;
        }
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMessage("");

        try {
            // Prepare payload with keys in the specified order and correct values
            const payload = {
                name: formData.fullName,
                username: formData.username,
                gender: formData.gender,
                relationship_status: formData.relationshipStatus,
                race: formData.race,
                education: formData.education,
                political_affiliation: formData.politicalAffiliation,
                annual_income: formData.annualIncome,
                expertise_id: formData.areaOfExpertise,
                birthdate: formData.dob ? formData.dob.toISOString() : null,
                country: formData.country,
                state: formData.state,
                city: formData.city,
                zipcode: formData.zipcode,
                bio: formData.bio,
                phone: formData.phone,
                email: formData.email,
            };

            console.log("Submitting profile update payload:", payload);

            const response = await axios.put(`${BASE_URL}/user/edit`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log("Profile update response:", response.data);

            if (response.data && response.data.status) {
                localStorage.setItem("user", JSON.stringify(response.data.data));
                setSuccessMessage(response.data.message || "Profile updated successfully!");
                setIsUpdated(true);
                
                if (onProfileUpdate) {
                    onProfileUpdate(response.data.data);
                }
            } else {
                const apiErrorMessage = response.data?.message || "Profile update failed.";
                setErrors({ apiError: apiErrorMessage });
                console.error("Profile update failed:", response.data);
                alert(apiErrorMessage);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setErrors({ apiError: "An error occurred during profile update." });
            alert("An error occurred during profile update.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {successMessage && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                                <span className="block sm:inline">{successMessage}</span>
                            </div>
                        )}

                        {/* Full Name and Username */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`w-full p-2 border ${errors.fullName ? "border-red-500" : "border-gray-300"} rounded-md`}
                                />
                                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`w-full p-2 border ${errors.username ? "border-red-500" : "border-gray-300"} rounded-md`}
                                />
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                            </div>
                        </div>

                        {/* Phone and Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        {/* DOB and Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <DatePicker
                                    selected={formData.dob}
                                    onChange={(date) => setFormData({ ...formData, dob: date })}
                                    dateFormat="MM/dd/yyyy"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Other Select Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Added log for annual income options and formData value */}
                            {console.log('Annual Income Options:', options.annualIncomes, 'Current formData.annualIncome:', formData.annualIncome)}
                            {[
                                ["relationshipStatus", "Relationship Status", options.relationshipStatuses],
                                ["politicalAffiliation", "Political Affiliation", options.politicalAffiliations],
                                ["race", "Race", options.races],
                                ["annualIncome", "Annual Income", options.annualIncomes],
                                ["areaOfExpertise", "Area of Expertise", options.areasOfExpertise],
                                ["education", "Education", options.educations]
                            ].map(([field, label, values]) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                                    <select
                                        name={field}
                                        value={formData[field] || ""} // Ensure value is never undefined
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Select {label}</option>
                                        {values.map((item) => {
                                            console.log(`Option for ${field}: ID = ${item.id}, Name = ${item.name}`);
                                            return (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* Location Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            {["country", "state", "city", "zipcode"].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-700">{field[0].toUpperCase() + field.slice(1)}</label>
                                    <input
                                        type="text"
                                        name={field}
                                        value={formData[field]}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                className={`w-full p-2 border ${errors.bio ? "border-red-500" : "border-gray-300"} rounded-md`}
                                rows="3"
                            ></textarea>
                            {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
                        </div>

                        {/* Submit and Cancel Buttons */}
                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-[#EF3E6E] to-orange-400 text-white rounded-md shadow hover:scale-105 transition-transform"
                            >
                                Update
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditProfileModal;
