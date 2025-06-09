import React from "react";

const StepSubmission = ({ prevStep }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Submission</h2>
      <p className="mb-6 text-gray-700">You're all set! 🎉</p>
      <button
        className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-2 rounded-xl"
        onClick={prevStep}
      >
        Previous
      </button>
    </div>
  );
};

export default StepSubmission;
