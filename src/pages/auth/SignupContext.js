import React, { createContext, useState } from "react";
import { BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";

export const SignupContext = createContext();

export const SignupProvider = ({ children }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    personalInfo: {},
    additionalInfo: {},
    contact: "", // email or phone
    otp: "",
  });

  // Add these new states for storing lists
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [expertiseList, setExpertiseList] = useState([]);

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const signupUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Signup failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Signup successful:", data);
      navigate("/home");
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <SignupContext.Provider
      value={{
        formData,
        updateFormData,
        signupUser,
        setFormData,
        countriesList,
        setCountriesList,
        statesList,
        setStatesList,
        expertiseList,
        setExpertiseList,
      }}
    >
      {children}
    </SignupContext.Provider>
  );
};
