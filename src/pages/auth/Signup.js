// Parent component (Signup.js)
import React, { useState } from "react";
import StepSidebar from "./StepSidebar";
import StepPersonalInfo from "./StepPersonalInfo";
import StepAdditionalInfo from "./StepAdditionalInfo";
import StepVerifyEmail from "./StepVerifyEmail";
import StepSubmission from "./StepSubmission";
import { SignupProvider } from "./SignupContext";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState({}); // Store all form data

  const nextStep = (data) => {
    setFormValues({ ...formValues, ...data }); // Merge new data with existing
    setStep(step + 1);
  };

  const prevStep = (data) => {
    setFormValues({ ...formValues, ...data }); // Merge new data with existing
    setStep(step - 1);
  };

  return (
    <SignupProvider>
      <div className="flex h-screen w-full font-sans bg-[#FAFAFA]">
        <StepSidebar currentStep={step} />

        <div className="w-3/4 p-10 flex flex-col justify-center">
          {step === 1 && (
            <StepPersonalInfo nextStep={nextStep} initialFormData={formValues} />
          )}
          {step === 2 && (
            <StepAdditionalInfo
              nextStep={nextStep}
              prevStep={prevStep}
              initialFormData={formValues}
            />
          )}
          {step === 3 && (
            <StepVerifyEmail
              nextStep={nextStep}
              prevStep={prevStep}
              initialFormData={formValues}
            />
          )}
          {step === 4 && (
            <StepSubmission prevStep={prevStep} initialFormData={formValues} />
          )}
        </div>
      </div>
    </SignupProvider>
  );
};

export default Signup;