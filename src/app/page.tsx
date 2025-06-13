'use client';

import { useState } from "react";
import VideoCall from "../components/VideoCall";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { authToken, logout } = useAuth();
  const [isInCall, setIsInCall] = useState(false);

  const startCall = () => {
    setIsInCall(true);
  };

  return (
    <div className='h-[100dvh] bg-neutral-900 text-neutral-100'>
      {isInCall ? (
        <div className='h-full flex flex-col'>
          {/* Header with user info */}
          <div className='bg-neutral-800 p-4 flex justify-between items-center'>
            <h1 className='text-lg font-semibold'>ZEST Video Call</h1>
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-neutral-400'>Signed in</span>
              <button onClick={logout} className='text-sm text-red-400 hover:text-red-300'>
                Logout
              </button>
            </div>
          </div>

          {/* Video Call Component */}
          <div className='flex-grow overflow-hidden'>
            <VideoCall />
          </div>
        </div>
      ) : (
        <div className='h-full flex flex-col items-center justify-center p-4'>
          <div className='max-w-md w-full bg-neutral-800 rounded-lg shadow-lg p-6'>
            <h1 className='text-2xl font-bold mb-6 text-center'>ZEST Video Call</h1>

            <div className='bg-neutral-700 p-4 rounded-md mb-6'>
              <p className='text-sm text-neutral-300 mb-1'>Your Auth Token:</p>
              <p className='font-mono text-xs bg-neutral-800 p-2 rounded overflow-auto'>{authToken}</p>
            </div>

            <div className='space-y-4'>
              <button
                onClick={startCall}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                  />
                </svg>
                <span>Start Video Call</span>
              </button>

              <button
                onClick={logout}
                className='w-full bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-4 py-3 rounded-lg transition-colors'>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
