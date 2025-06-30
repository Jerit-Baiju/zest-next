'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoCallProps {
  ws: WebSocket | null;
  callId: string | null;
  partnerId: string | null;
  onEndCall: () => void;
}

const OnlyMCVideoCall = ({ ws, callId, partnerId, onEndCall }: VideoCallProps) => {
  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // States for UI controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    initializeWebRTC();
    startCallTimer();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
    }
  }, [ws]);

  const startCallTimer = () => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  };

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionStatus('connected');
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && ws) {
          ws.send(JSON.stringify({
            type: 'webrtc_ice',
            candidate: event.candidate
          }));
        }
      };

      // Monitor connection state
      peerConnection.onconnectionstatechange = () => {
        setConnectionStatus(peerConnection.connectionState);
      };

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setConnectionStatus('failed');
    }
  };

  const handleWebSocketMessage = async (data: any) => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;

    switch (data.type) {
      case 'webrtc_offer':
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          if (ws) {
            ws.send(JSON.stringify({
              type: 'webrtc_answer',
              answer: answer
            }));
          }
        } catch (error) {
          console.error('Error handling offer:', error);
        }
        break;

      case 'webrtc_answer':
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (error) {
          console.error('Error handling answer:', error);
        }
        break;

      case 'webrtc_ice':
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error handling ICE candidate:', error);
        }
        break;

      case 'call_ended':
      case 'partner_disconnected':
        cleanup();
        onEndCall();
        break;
    }
  };

  const createOffer = async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection || !ws) return;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      ws.send(JSON.stringify({
        type: 'webrtc_offer',
        offer: offer
      }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    cleanup();
    onEndCall();
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start creating offer after initialization (caller behavior)
  useEffect(() => {
    if (peerConnectionRef.current && ws) {
      setTimeout(createOffer, 1000);
    }
  }, [ws]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-md p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">onlyMC Video Call</h1>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-purple-300">Call ID: {callId?.substring(0, 8)}</span>
            <span className="text-green-300">{formatDuration(callDuration)}</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`}></div>
              <span className="text-xs text-gray-300 capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>
        <div className="text-2xl">💖</div>
      </div>

      {/* Main video container */}
      <div className="relative flex-grow bg-black overflow-hidden">
        {/* Remote video (main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-1/4 max-w-[200px] aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-pink-400">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-4xl">📷</div>
            </div>
          )}
        </div>

        {/* Connection status overlay */}
        {connectionStatus !== 'connected' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">
                {connectionStatus === 'connecting' ? '💫' : 
                 connectionStatus === 'failed' ? '💔' : '⏳'}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {connectionStatus === 'connecting' ? 'Connecting to your match...' :
                 connectionStatus === 'failed' ? 'Connection failed' :
                 'Establishing connection...'}
              </h2>
              <p className="text-purple-300">
                {connectionStatus === 'connecting' ? 'Hold tight, love is in the air! 💕' :
                 connectionStatus === 'failed' ? 'Something went wrong. Please try again.' :
                 'Setting up the perfect connection...'}
              </p>
            </div>
          </div>
        )}

        {/* Romantic overlay for connected state */}
        {connectionStatus === 'connected' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="animate-bounce text-6xl opacity-20">💖</div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-black bg-opacity-50 backdrop-blur-md p-4 flex items-center justify-center space-x-6">
        {/* Mute button */}
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all duration-300 ${
            isMuted 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
          }`}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        {/* Video toggle button */}
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all duration-300 ${
            isVideoOff 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
          }`}
        >
          {isVideoOff ? '📷' : '📹'}
        </button>

        {/* End call button */}
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300 transform hover:scale-105"
        >
          <span className="text-xl">📞</span>
        </button>
      </div>

      {/* Romantic message overlay */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
        <p className="text-white text-sm bg-black bg-opacity-30 px-4 py-2 rounded-full">
          💖 Enjoy your onlyMC moment! 💖
        </p>
      </div>
    </div>
  );
};

export default OnlyMCVideoCall;
