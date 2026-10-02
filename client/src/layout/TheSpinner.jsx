import React from "react";

const TheSpinner = () => {
  return (
    <div className="w-full flex items-center justify-center py-16">
      {/* Clean, minimalist, and fast-spinning loader */}
      <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default TheSpinner;