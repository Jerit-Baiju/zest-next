'use client';

import { useEffect, useRef, useState } from 'react';

const VideoCall = () => {
  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // States for UI controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // This would be replaced with actual WebRTC implementation
  useEffect(() => {
    // Mock implementation - in a real app, this would be WebRTC logic
    if (localVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          // In a real app, you'd send this stream to the peer
          // and receive their stream to put in remoteVideoRef
          
          // Mock remote video with a delayed copy of local for demo purposes
          setTimeout(() => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
          }, 1000);
        })
        .catch(err => console.error('Error accessing media devices:', err));
    }
    
    // Cleanup
    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const audioTracks = (localVideoRef.current.srcObject as MediaStream).getAudioTracks();
      audioTracks.forEach(track => track.enabled = isMuted);
    }
  };
  
  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const videoTracks = (localVideoRef.current.srcObject as MediaStream).getVideoTracks();
      videoTracks.forEach(track => track.enabled = isVideoOff);
    }
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Implement fullscreen toggle logic here
  };
  
  const endCall = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    // Additional logic to end the call
  };
  
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="w-full h-full flex flex-col max-h-full">
      {/* Main video container - responsive for both desktop and mobile */}
      <div className="relative flex-grow bg-neutral-900 rounded-lg overflow-hidden min-h-0">
        {/* Remote video (main/large video) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        />
        
        {/* Local video (smaller picture-in-picture) */}
        <div className="absolute top-4 right-4 w-1/4 max-w-[180px] aspect-video rounded-lg overflow-hidden shadow-lg border-2 border-neutral-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 bg-opacity-80">
              <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center">
                <span className="text-xl text-neutral-300">You</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Call duration - centered at top */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-neutral-800 bg-opacity-60 px-3 py-1 rounded-full">
          <span className="text-sm text-neutral-100">12:34</span>
        </div>
      </div>
      
      {/* Controls bar */}
      <div className="bg-neutral-800 p-4 rounded-b-lg flex items-center justify-center space-x-4 md:space-x-6">
        {/* Mute button */}
        <button 
          onClick={toggleMute}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-neutral-600' : 'bg-neutral-700'} hover:bg-neutral-600 transition-colors`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 010-7.072m12.728 0a9 9 0 010 12.728M3 11.539l4.024-2.565M21 11.539l-4.024-2.565" />
            )}
          </svg>
        </button>
        
        {/* Video toggle button */}
        <button 
          onClick={toggleVideo}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-neutral-600' : 'bg-neutral-700'} hover:bg-neutral-600 transition-colors`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isVideoOff ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
        </button>
        
        {/* End call button */}
        <button 
          onClick={endCall}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
        
        {/* Chat button */}
        <button 
          onClick={toggleChat}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${isChatOpen ? 'bg-neutral-600' : 'bg-neutral-700'} hover:bg-neutral-600 transition-colors`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        
        {/* Fullscreen button */}
        <button 
          onClick={toggleFullscreen}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${isFullscreen ? 'bg-neutral-600' : 'bg-neutral-700'} hover:bg-neutral-600 transition-colors`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V5H5v4m14 0V5h-4v4M5 19h4v-4H5m14 4h-4v-4h4" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Chat overlay - conditionally rendered */}
      {isChatOpen && (
        <div className="absolute right-0 bottom-24 md:bottom-28 bg-neutral-800 rounded-lg shadow-xl w-full max-w-xs md:max-w-sm h-2/3 max-h-96 flex flex-col">
          <div className="p-3 border-b border-neutral-700 flex justify-between items-center">
            <h3 className="text-neutral-100 font-medium">Chat</h3>
            <button onClick={toggleChat} className="text-neutral-400 hover:text-neutral-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-grow p-3 overflow-y-auto space-y-3">
            <div className="flex justify-start">
              <div className="bg-neutral-700 rounded-lg p-2 max-w-[80%]">
                <p className="text-sm text-neutral-100">Hey there! How are you?</p>
                <p className="text-xs text-neutral-400 text-right mt-1">12:30</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-blue-600 rounded-lg p-2 max-w-[80%]">
                <p className="text-sm text-white">I'm good, thanks! How about you?</p>
                <p className="text-xs text-blue-300 text-right mt-1">12:31</p>
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-neutral-700">
            <div className="flex">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-grow bg-neutral-700 text-neutral-100 rounded-l-md px-3 py-2 focus:outline-none"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
