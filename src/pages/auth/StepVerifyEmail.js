import React, { useState, useContext, useEffect } from "react";
import { SignupContext } from "./SignupContext";
import { BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";

const StepVerifyEmail = ({ nextStep, prevStep }) => {
  const navigate = useNavigate();
  const {
    formData,
    updateFormData,
    countriesList,
    statesList,
    expertiseList,
  } = useContext(SignupContext);
  console.log("Form Data in StepVerifyEmail:", formData);

  // Initialize state from context if available
  const [email, setEmail] = useState(formData.contact || "");
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Save state to context when it changes
  useEffect(() => {
    updateFormData({ contact: email });
  }, [email]);

  // Timer interval reference
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (countriesList && statesList && expertiseList) {
      setIsDataLoaded(true);
    }
  }, [countriesList, statesList, expertiseList]);

  const handlePrevious = () => {
    // Save current state before going back
    updateFormData({
      contact: email,
      otp: otp,
      otpSent: otpSent
    });
    prevStep();
  };

  const checkEmailAvailability = async (emailToCheck) => {
    try {
      const apiUrl = `${BASE_URL}/public/check?type=email&email=${encodeURIComponent(
        emailToCheck
      )}&user_name=&cc=&ph=`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      // According to your original logic,
      // status true means email exists (not available)
      if (data.status === true) {
        return true; // Email exists
      } else {
        return false; // Email available
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return null; // Error occurred
    }
  };

  const handleSendOtp = async () => {
    setError("");

    if (!email) {
      setError("Please enter an email.");
      return;
    }

    // Validate email format simple regex
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const isEmailAvailable = await checkEmailAvailability(email);

    if (isEmailAvailable === true) {
      setError("Email already in use or invalid.");
      return;
    }
    if (isEmailAvailable === null) {
      setError("Error verifying email. Please try again.");
      return;
    }

    try {
      const signupApiUrl = `${BASE_URL}/user/sign-up`;

      if (isDataLoaded) {
        const countryName =
          countriesList.find((c) => c.id === parseInt(formData.additionalInfo.country))

        const stateName =
          statesList.find((s) => s.id === parseInt(formData.additionalInfo.state))

        const expertiseId = formData.additionalInfo.areaOfExpertise;

        // Format birthdate
        const formattedBirthdate = formData.personalInfo.dob
          ? new Date(formData.personalInfo.dob).toISOString().slice(0, 10)
          : "";

        // Build URL encoded payload
        const payload = new URLSearchParams();
        payload.append("name", formData.personalInfo.fullName || "");
        payload.append("user_name", formData.personalInfo.username || "");
        payload.append("password", formData.personalInfo.password || "");
        payload.append("gender", formData.personalInfo.gender || "");
        payload.append("birthdate", formattedBirthdate);
        payload.append(
          "relationship_status",
          formData.additionalInfo.relationshipStatus || ""
        );
        payload.append(
          "political_affiliation",
          formData.additionalInfo.politicalAffiliation || ""
        );
        payload.append("education", formData.additionalInfo.education || "");
        payload.append("race", formData.additionalInfo.race || "");
        payload.append("country", countryName?.name); // Correct Country Name
        payload.append("state", stateName?.name); // Correct State Name
        payload.append("city", formData.additionalInfo.city || "");
        payload.append("zipcode", formData.additionalInfo.zipcode || "");
        payload.append(
          "annual_income",
          formData.additionalInfo.annualIncome || ""
        );
        payload.append("expertise_id", expertiseId ? expertiseId.toString() : "");
        payload.append("email", email);

        console.log("Final Payload:", payload.toString());

        const response = await fetch(signupApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: payload.toString(),
        });

        if (response.ok) {
          updateFormData({ contact: email });
          setOtpSent(true);
          setTimer(30);
          setOtp("");
          setError("");
          console.log("Signup successful, OTP sent to", email);
        } else {
          const errorText = await response.text();
          setError("Failed to send OTP. Please try again.");
          console.error("Signup failed:", response.status, errorText);
        }
      } else {
        setError("Please wait, data is loading");
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError("Failed to send OTP. Please try again.");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // only allow digits or empty

    // Update OTP string by replacing character at index
    const otpArr = otp.padEnd(4, " ").split("");
    otpArr[index] = value;
    const newOtp = otpArr.join("").trim();
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    setError("");
      
    if (otp.length !== 4) {
      setError("Please enter the 4-digit OTP.");
      return;
    }

    try {
      const verifyApiUrl = `${BASE_URL}/user/verify`;
      
      const payload = {
        email: email,
        otp: otp
      };

      const response = await fetch(verifyApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        console.log("Verification successful:", data);
        // Store the token if needed
        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
          // Clear form data from context after successful signup
          updateFormData({
            personalInfo: {},
            additionalInfo: {},
            contact: "",
            otp: "",
          });
          // Navigate to home page
          navigate("/");
        }
      } else {
        setError(data.message || "Verification failed. Please try again.");
        console.error("Verification failed:", data);
      }
    } catch (error) {
      setError("Error during verification. Please try again.");
      console.error("Verification error:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2">Verify Email</h2>
      <p className="mb-6 text-gray-600">Verify your email to secure your account.</p>

      <label className="block text-sm font-medium text-gray-700 mb-1">Email Id</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-4 px-4 py-2 border rounded-lg bg-gray-50 disabled:bg-gray-200"
        disabled={otpSent}
        placeholder="Enter your email"
      />

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {otpSent && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Verification Code
          </label>
          <p className="text-sm text-gray-600 mb-2">
            Verification code has been sent to <b>{email}</b>
          </p>
          <div className="flex gap-2 mb-4">
            {[...Array(4)].map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                className="w-12 h-12 text-center border rounded-lg focus:outline-pink-500"
                value={otp[i] || ""}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                inputMode="numeric"
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-10 flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          className="px-6 py-3 border border-gray-300 rounded-full font-semibold"
        >
          PREVIOUS
        </button>
        {!otpSent ? (
          <button
            onClick={handleSendOtp}
            className="px-6 py-3 bg-gradient-to-r from-[#EF3E6E] to-orange-400 text-white font-semibold rounded-full shadow hover:scale-105 transition-transform"
          >
            SEND OTP
          </button>
        ) : (
          <button
            onClick={handleVerify}
            className="px-6 py-3 bg-gradient-to-r from-[#EF3E6E] to-orange-400 text-white font-semibold rounded-full shadow hover:scale-105 transition-transform"
          >
            VERIFY
          </button>
        )}
      </div>

      {otpSent && timer > 0 && (
        <p className="text-sm text-gray-500 mt-2">Resend OTP in {timer} seconds</p>
      )}

      {otpSent && timer === 0 && (
        <button
          onClick={handleSendOtp}
          className="mt-2 text-sm text-pink-600 hover:underline"
        >
          Resend OTP
        </button>
      )}
    </div>
  );
};

export default StepVerifyEmail;