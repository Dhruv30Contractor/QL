import React, { useState, useEffect, useContext } from "react"; // Import useContext
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isBefore, subYears } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { BASE_URL } from "../../config";
import { SignupContext } from "./SignupContext"; // Import SignupContext

const StepPersonalInfo = ({ nextStep, initialFormData }) => {
  const { formData, updateFormData } = useContext(SignupContext); // Connect to Context
  const [formValues, setFormValues] = useState({
    fullName: "",
    username: "",
    dob: null,
    gender: "",
    password: "",
    confirmPassword: "",
    profilePhoto: null,
    ...initialFormData?.personalInfo, // Destructure nested object,
  });
  const [preview, setPreview] = useState("/default-profile.png");
  const [errors, setErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await fetch("/default-profile.png");
        if (!response.ok) throw new Error();
      } catch {
        setPreview("https://via.placeholder.com/50");
      }
    };
    loadImage();
  }, []);

  useEffect(() => {
    const { username } = formValues;
    if (!username.trim()) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(username.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [formValues.username]);

  const checkUsernameAvailability = async (username) => {
    setCheckingUsername(true);
    try {
      const apiUrl = `${BASE_URL}/public/check?user_name=${encodeURIComponent(
        username
      )}&type=username&cc=&ph=&email=undefined`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === true) {
        setUsernameAvailable(false);
        setErrors((prev) => ({
          ...prev,
          username: "Username is already taken.",
        }));
      } else {
        setUsernameAvailable(true);
        setErrors((prev) => ({ ...prev, username: "" }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        username: "Error checking username.",
      }));
      console.error("Error checking username:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formValues.fullName.trim()) newErrors.fullName = "Full Name is required.";
    if (!formValues.username.trim()) newErrors.username = "Username is required.";
    if (usernameAvailable === false) newErrors.username = "Username is already taken.";
    if (!formValues.dob) newErrors.dob = "Date of Birth is required.";
    else {
      if (!isBefore(formValues.dob, new Date()))
        newErrors.dob = "DOB cannot be in the future.";

      // Check if user is at least 13 years old
      const thirteenYearsAgo = subYears(new Date(), 13);
      if (!isBefore(formValues.dob, thirteenYearsAgo))
        newErrors.dob = "You must be at least 13 years old.";
    }
    if (!formValues.gender) newErrors.gender = "Gender is required.";
    if (!formValues.password) newErrors.password = "Password is required.";
    else if (formValues.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (formValues.confirmPassword !== formValues.password) newErrors.confirmPassword = "Passwords do not match.";
    return newErrors;
  };

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormValues({ ...formValues, profilePhoto: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Wrap values into PersonalInfo key
    updateFormData({ personalInfo: formValues });
    nextStep();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-10 rounded-2xl shadow-md max-w-4xl w-full mx-auto"
    >
      <h2 className="text-2xl font-bold mb-2">Create an account</h2>
      <p className="text-sm text-gray-500 mb-8">
        Join Queryloom to explore trending topics, engage in meaningful discussions, and share your voice with a community that values knowledge and interaction.
      </p>

      <div className="grid grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formValues.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            className={`w-full mt-1 p-3 border ${errors.fullName ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF3E6E]`}
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        {/* Username */}
        <div>
          <label className="text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            name="username"
            value={formValues.username}
            onChange={handleChange}
            placeholder="Enter your username"
            required
            className={`w-full mt-1 p-3 border ${errors.username ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF3E6E]`}
          />
          {checkingUsername && <p className="text-sm text-gray-500 mt-1">Checking username...</p>}
          {usernameAvailable && !errors.username && <p className="text-green-600 text-sm mt-1">Username is available.</p>}
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

        {/* DOB */}
        <div>
          <label className="text-sm font-medium text-gray-700">Date Of Birth</label>
          <DatePicker
            selected={formValues.dob}
            onChange={(date) => setFormValues({ ...formValues, dob: date })}
            maxDate={new Date()}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            dateFormat="dd-MM-yyyy"
            placeholderText="Select your DOB"
            className={`block w-full p-3 rounded-lg border ${errors.dob ? "border-red-500" : "border-gray-300"} text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#EF3E6E]`}
          />
          {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="text-sm font-medium text-gray-700">Gender</label>
          <select
            name="gender"
            value={formValues.gender}
            onChange={handleChange}
            required
            className={`w-full mt-1 p-3 border ${errors.gender ? "border-red-500" : "border-gray-300"} rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#EF3E6E]`}
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
        </div>

        {/* Password */}
        <div className="relative">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formValues.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className={`w-full mt-1 p-3 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF3E6E]`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <label className="text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formValues.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            className={`w-full mt-1 p-3 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF3E6E]`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
          </button>
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Upload Photo */}
      <div className="mt-6">
        <label className="text-sm font-medium text-gray-700 block mb-2">Upload Profile Photo</label>
        <div className="flex items-center space-x-4">
          <img
            src={preview}
            alt="Upload Preview"
            className="w-12 h-12 rounded-full border border-gray-300 object-cover"
          />
          <label
            htmlFor="upload-photo"
            className="text-gray-600 font-medium hover:text-[#EF3E6E] cursor-pointer"
          >
            Choose Photo
          </label>
          <input
            type="file"
            id="upload-photo"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="mt-10 flex justify-end">
        <button
          type="submit"
          className="bg-[#EF3E6E] hover:bg-[#d32f5b] text-white px-6 py-3 rounded-lg font-medium shadow-md transition duration-200"
        >
          Continue
        </button>
      </div>
    </form>
  );
};

export default StepPersonalInfo;