import React, { useState, useEffect, useContext } from "react";
import { BASE_URL } from "../../config"; // Adjust the path as necessary
import { SignupContext } from "./SignupContext";

const StepAdditionalInfo = ({ prevStep, nextStep, initialFormData }) => {
  const { updateFormData, setCountriesList, setStatesList, setExpertiseList, setFormData } = useContext(SignupContext); // Connect to Context 
  const [formValues, setFormValues] = useState({
    country: "",
    state: "",
    city: "",
    zipcode: "",
    relationshipStatus: "",
    politicalAffiliation: "",
    race: "",
    annualIncome: "",
    areaOfExpertise: "",
    education: "",
    ...initialFormData?.additionalInfo, // initial from here
  });

  const [options, setOptions] = useState({
    countries: [],
    states: [],
    cities: [],
    relationshipStatuses: [],
    politicalAffiliations: [],
    races: [],
    annualIncomes: [],
    areasOfExpertise: [],
    educations: [],
  });

  const [loading, setLoading] = useState({
    countries: true,
    states: true,
    cities: true,
    relationshipStatuses: true,
    politicalAffiliations: true,
    races: true,
    annualIncomes: true,
    areasOfExpertise: true,
    educations: true,
  });

  const [errors, setErrors] = useState({
    country: "",
    state: "",
    city: "",
    zipcode: "",
    relationshipStatus: "",
    politicalAffiliation: "",
    race: "",
    annualIncome: "",
    areaOfExpertise: "",
    education: "",
    agree: "",
  });

  const [agree, setAgree] = useState(false);

  const token = localStorage.getItem("token");

  const fetchData = async (endpoint, key) => {
    try {
      setLoading((prev) => ({ ...prev, [key]: true })); // Set loading to true before fetch
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
        // Handle the specific structure for annualIncomes
        if (data?.status && Array.isArray(data.data)) {
          // Create a new array of objects with id and name properties
          const annualIncomes = data.data.map((income, index) => ({
            id: index, // Generate a unique id (e.g., index)
            name: [
              "Getting by with Support",
              "Meeting Essentials",
              "Financially Stable",
              "Comfortably Established",
              "Financially Thriving",
              "Prosperous and Expanding",
              "Ultra Wealthy",
            ][index], // Use the string as the name
            value: income,
          }));
          setOptions((prev) => ({ ...prev, [key]: annualIncomes }));
        } else {
          setErrors((prev) => ({
            ...prev,
            [key]: "Invalid data format received for annualIncomes.",
          }));
        }
      }
      // Different data handling for country, state, and city
      else if (key === "countries" || key === "states" || key === "cities") {
        if (Array.isArray(data)) {
          if (key === "countries") {
            setCountriesList(data); // Store countries in context
          }
          else if (key === "states") {
            setStatesList(data); // Store states in context
          }
          setOptions((prev) => ({ ...prev, [key]: data }));
        } else {
          setErrors((prev) => ({
            ...prev,
            [key]: "Invalid data format received.",
          }));
        }
      }
      
      else if (key === "areasOfExpertise") {
        if (data?.status && Array.isArray(data.data)) {
          setExpertiseList(data.data); // Store areas of expertise in context
          setOptions((prev) => ({ ...prev, [key]: data.data })); // Set options in local state
        } else {
          setErrors((prev) => ({
            ...prev,
            [key]: "Invalid data format received for expertise.",
          }));
        }
      }

      else {
        // Original data handling for other fields
        if (data?.status && Array.isArray(data.data)) {
          setOptions((prev) => ({ ...prev, [key]: data.data }));
        } else {
          setErrors((prev) => ({
            ...prev,
            [key]: "Invalid data format received.",
          }));
        }
      }
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({ ...prev, [key]: "Error fetching data." }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false })); // Set loading to false after fetch
    }
  };

  useEffect(() => {
    fetchData("/public/countries?search=", "countries");
    fetchData(
      "/public/relationship-status?poll_id=8&type=data",
      "relationshipStatuses"
    );
    fetchData(
      "/public/poll-affiliations?poll_id=8&type=data",
      "politicalAffiliations"
    );
    fetchData("/public/races?poll_id=8&type=history", "races");
    fetchData("/public/annual-income", "annualIncomes");
    fetchData("/public/expertise?poll_id=8&type=history", "areasOfExpertise");
    fetchData("/public/education?poll_id=8&type=history", "educations");
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (formValues.country) {
      fetchData(`/public/states?c_id=${formValues.country}&search=`, "states");
      // Reset state and city when country change
      setFormValues((prev) => ({ ...prev, state: "", city: "" }));
      setOptions((prev) => ({ ...prev, states: [], cities: [] }));
    }
  }, [formValues.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (formValues.state) {
      fetchData(
        `/public/cities?c_id=${formValues.country}&s_id=${formValues.state}&search=`,
        "cities"
      );
      // Reset city when state changes
      setFormValues((prev) => ({ ...prev, city: "" }));
      setOptions((prev) => ({ ...prev, cities: [] }));
    }
  }, [formValues.state, formValues.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "country") {
      setFormData((prev) => ({
        ...prev,
        additionalInfo: { ...prev.additionalInfo, country: value },
      }))
    }
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!formValues.relationshipStatus) {
      newErrors.relationshipStatus = "Please select a relationship status.";
      isValid = false;
    }
    if (!formValues.politicalAffiliation) {
      newErrors.politicalAffiliation = "Please select a political affiliation.";
      isValid = false;
    }
    if (!formValues.race) {
      newErrors.race = "Please select a race.";
      isValid = false;
    }
    if (!formValues.annualIncome) {
      newErrors.annualIncome = "Please select an annual income.";
      isValid = false;
    }
    if (!formValues.areaOfExpertise) {
      newErrors.areaOfExpertise = "Please select an area of expertise.";
      isValid = false;
    }
    if (!formValues.education) {
      newErrors.education = "Please select an education level.";
      isValid = false;
    }
    if (!formValues.country) {
      newErrors.country = "Please select a country.";
      isValid = false;
    }
    if (!formValues.state) {
      newErrors.state = "Please select a state.";
      isValid = false;
    }
    if (!formValues.city) {
      newErrors.city = "Please select a city.";
      isValid = false;
    }
    if (!formValues.zipcode) {
      newErrors.zipcode = "Please enter a zipcode.";
      isValid = false;
    } else if (!/^\d{6}$/.test(formValues.zipcode)) {
      newErrors.zipcode = "Please enter a valid 6-digit zipcode.";
      isValid = false;
    }
    if (!agree) {
      newErrors.agree = "Please agree to the terms and conditions.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateForm()) {
      console.log("Raw formValues:", formValues);
      console.log("Options:", options);

      // const countryObj = options?.countries?.find(
      //   (c) => c.id === formValues.country
      // );
      // const stateObj = options?.states?.find(
      //   (s) => s.id === formValues.state
      // );
      // const expertiseObj = options?.areasOfExpertise?.find(
      //   (e) => e.name === formValues.areaOfExpertise
      // );

      // console.log("Matched Country Object:", countryObj);
      // console.log("Matched State Object:", stateObj);
      // console.log("Matched Expertise Object:", expertiseObj);

      // const updatedFormValues = {
      //   ...formValues,
      //   country: countryObj?.name || "",
      //   state: stateObj?.name || "",
      //   expertise_id: expertiseObj?.id || null,
      // };
       const updatedFormValues = {
         ...formValues,
       };

      console.log("Updated formValues for payload:", updatedFormValues);

      updateFormData({ additionalInfo: updatedFormValues,  countriesList: options.countries, statesList: options.states, expertiseList: options.areasOfExpertise });
      nextStep();
    }
  };

  const handlePrevious = () => {
    console.log("Going to previous step with data:", formValues);
    prevStep({ additionalInfo: formValues });
  };

  console.log("Rendering StepAdditionalInfo with formValues:", formValues);

  return (
    <div className="bg-white p-10 rounded-2xl shadow-md max-w-4xl w-full mx-auto">
      <h2 className="text-2xl font-bold mb-2">
        Additional Info <span title="Info">ℹ️</span>
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Provide additional details to personalize your experience.
      </p>

      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Relationship Status */}
        <div>
          <select
            name="relationshipStatus"
            value={formValues.relationshipStatus}
            onChange={handleChange}
            className={`p-3 border ${
              errors.relationshipStatus ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select Relationship Status</option>
            {loading.relationshipStatuses && (
              <option disabled>Loading...</option>
            )}
            {errors.relationshipStatuses && (
              <option disabled>{errors.relationshipStatuses}</option>
            )}
            {!loading.relationshipStatuses &&
              !errors.relationshipStatuses &&
              options.relationshipStatuses.map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.relationshipStatus && (
            <p className="text-red-500 text-xs mt-1">
              {errors.relationshipStatus}
            </p>
          )}
        </div>

        {/* Political Affiliation */}
        <div>
          <select
            name="politicalAffiliation"
            value={formValues.politicalAffiliation}
            onChange={handleChange}
            className={`p-3 border ${
              errors.politicalAffiliation ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select Political Affiliation</option>
            {loading.politicalAffiliations && (
              <option disabled>Loading...</option>
            )}
            {errors.politicalAffiliations && (
              <option disabled>{errors.politicalAffiliations}</option>
            )}
            {!loading.politicalAffiliations &&
              !errors.politicalAffiliations &&
              options.politicalAffiliations.map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.politicalAffiliation && (
            <p className="text-red-500 text-xs mt-1">
              {errors.politicalAffiliation}
            </p>
          )}
        </div>

        {/* Race */}
        <div>
          <select
            name="race"
            value={formValues.race}
            onChange={handleChange}
            className={`p-3 border ${
              errors.race ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select Race</option>
            {loading.races && <option disabled>Loading...</option>}
            {errors.races && <option disabled>{errors.races}</option>}
            {!loading.races &&
              !errors.races &&
              options.races.map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.race && (
            <p className="text-red-500 text-xs mt-1">{errors.race}</p>
          )}
        </div>

        {/* Annual Income */}
        <div>
          <select
            name="annualIncome"
            value={formValues.annualIncome}
            onChange={handleChange}
            className={`p-3 border ${
              errors.annualIncome ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select Annual Income</option>
            {loading.annualIncomes && <option disabled>Loading...</option>}
            {errors.annualIncomes && (
              <option disabled>{errors.annualIncomes}</option>
            )}
            {!loading.annualIncomes &&
              !errors.annualIncomes &&
              options.annualIncomes.map((item) => (
                <option key={item.id} value={item.value}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.annualIncome && (
            <p className="text-red-500 text-xs mt-1">{errors.annualIncome}</p>
          )}
        </div>
        {/* Area of Expertise */}
        <div>
          <select
            name="areaOfExpertise"
            value={formValues.areaOfExpertise}
            onChange={handleChange}
            className={`p-3 border ${
              errors.areaOfExpertise ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select Area of Expertise</option>
            {loading.areasOfExpertise && <option disabled>Loading...</option>}
            {errors.areasOfExpertise && (
              <option disabled>{errors.areasOfExpertise}</option>
            )}
            {!loading.areasOfExpertise &&
              !errors.areasOfExpertise &&
              options.areasOfExpertise.map((item) => (
                <option key={item._id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.areaOfExpertise && (
            <p className="text-red-500 text-xs mt-1">
              {errors.areaOfExpertise}
            </p>
          )}
        </div>

        {/* Education */}
        <div>
          <select
            name="education"
            value={formValues.education}
            onChange={handleChange}
            className={`p-3 border ${
              errors.education ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select Education</option>
            {loading.educations && <option disabled>Loading...</option>}
            {errors.education && <option disabled>{errors.education}</option>}
            {!loading.educations &&
              !errors.educations &&
              options.educations.map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.education && (
            <p className="text-red-500 text-xs mt-1">{errors.education}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <select
            name="country"
            value={formValues.country}
            onChange={handleChange}
            className={`p-3 border ${
              errors.country ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select Country</option>
            {loading.countries && <option disabled>Loading...</option>}
            {errors.countries && <option disabled>{errors.countries}</option>}
            {!loading.countries &&
              !errors.countries &&
              options.countries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.country && (
            <p className="text-red-500 text-xs mt-1">{errors.country}</p>
          )}
        </div>

        {/* State */}
        <div>
          <select
            name="state"
            value={formValues.state}
            onChange={handleChange}
            disabled={!formValues.country}
            className={`p-3 border ${
              errors.state ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select State</option>
            {loading.states && <option disabled>Loading...</option>}
            {errors.states && <option disabled>{errors.states}</option>}
            {!loading.states &&
              !errors.states &&
              options.states.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state}</p>
          )}
        </div>

        {/* City */}
        <div>
          <select
            name="city"
            value={formValues.city}
            onChange={handleChange}
            disabled={!formValues.state}
            className={`p-3 border ${
              errors.city ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          >
            <option value="">Select City</option>
            {loading.cities && <option disabled>Loading...</option>}
            {errors.cities && <option disabled>{errors.cities}</option>}
            {!loading.cities &&
              !errors.cities &&
              options.cities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
          )}
        </div>

        {/* Zipcode */}
        <div>
          <input
            type="text"
            name="zipcode"
            value={formValues.zipcode}
            onChange={handleChange}
            placeholder="Zipcode"
            className={`p-3 border ${
              errors.zipcode ? "border-red-500" : "border-gray-300"
            } rounded-lg w-full`}
          />
          {errors.zipcode && (
            <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>
          )}
        </div>
      </div>

      <div className="flex items-center mt-4">
        <input
          type="checkbox"
          id="agree"
          checked={agree}
          onChange={() => setAgree(!agree)}
          className="mr-2"
        />
        <label htmlFor="agree" className="text-sm text-gray-600">
          I agree to the{" "}
          <span className="text-pink-500">Terms and Conditions</span> and{" "}
          <span className="text-pink-500">Privacy Policy</span>.
        </label>
        {errors.agree && (
          <p className="text-red-500 text-xs mt-1">{errors.agree}</p>
        )}
      </div>

      <div className="mt-10 flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          className="px-6 py-3 border border-gray-300 rounded-full font-semibold"
        >
          PREVIOUS
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-[#EF3E6E] to-orange-400 text-white font-semibold rounded-full shadow hover:scale-105 transition-transform"
        >
          NEXT STEP
        </button>
      </div>
    </div>
  );
};

export default StepAdditionalInfo;