import React from "react";
import { FaUser, FaInfoCircle, FaCheckCircle, FaPaperPlane } from "react-icons/fa";

const StepSidebar = ({ currentStep }) => {
  const steps = [
    { icon: <FaUser />, label: "Personal Details", desc: "Let's start with the basic info" },
    { icon: <FaInfoCircle />, label: "Additional Info", desc: "Tell us more about yourself" },
    { icon: <FaCheckCircle />, label: "Verify Phone/Email", desc: "Confirm your identity" },
    { icon: <FaPaperPlane />, label: "Submission", desc: "You're almost done!" },
  ];

  return (
    <div className="w-1/4 bg-white p-6 rounded-r-3xl shadow-md flex flex-col justify-between">
      <div>
        <h1 className="text-[#EF3E6E] text-2xl font-bold mb-8">QUERYLOOM</h1>
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className={`${currentStep - 1 === index ? "text-[#EF3E6E]" : "text-gray-500"} mt-1`}>
                {step.icon}
              </div>
              <div>
                <p className="font-medium">{step.label}</p>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full flex justify-center">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Sample_image.svg/600px-Sample_image.svg.png"
          alt="Illustration"
          className="w-24 opacity-20"
        />
      </div>
    </div>
  );
};

export default StepSidebar;
