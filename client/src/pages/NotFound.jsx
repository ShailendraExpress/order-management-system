import React from 'react';
import { useNavigate } from 'react-router-dom';

const Error = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-lg w-full text-center">
                
                {/* Large 404 Visual */}
                <h1 className="text-9xl font-extrabold text-gray-200 tracking-tighter drop-shadow-sm">
                    404
                </h1>
                
                {/* Error Message */}
                <h2 className="mt-6 text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
                    Oops! Page not found
                </h2>
                <p className="mt-4 text-base text-gray-500 leading-relaxed">
                    Sorry, we couldn't find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                {/* Action Button */}
                <div className="mt-10 flex justify-center">
                    <button 
                        onClick={() => navigate('/', { replace: true })} 
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Back to Home
                    </button>
                </div>
                
            </div>
        </div>
    );
};

export default Error;