'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VideoCall from '../components/VideoCall';
import Loading from '../components/Loading';

export default function OnlyMCApp() {
  const { authToken, logout } = useAuth();
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected, queued, matched, in_call
  const [queuePosition, setQueuePosition] = useState(0);
  const [ws, setWs] = useState(null);
  const [callId, setCallId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authToken) {
      connectToVideoChat();
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [authToken]);

  const connectToVideoChat = () => {
    setConnectionState('connecting');
    setMessage('Connecting to onlyMC...');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${process.env.NEXT_PUBLIC_DJANGO_HOST || 'localhost:8000'}/ws/video-call/`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('Connected to onlyMC video chat');
      setConnectionState('connected');
      setMessage('Connected! Welcome to onlyMC 💖');
      
      // Authenticate with token
      websocket.send(JSON.stringify({
        type: 'authenticate',
        token: authToken
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    websocket.onclose = () => {
      console.log('Disconnected from onlyMC');
      setConnectionState('disconnected');
      setMessage('Disconnected from onlyMC 💔');
      
      // Attempt to reconnect after 3 seconds
      setTimeout(connectToVideoChat, 3000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionState('disconnected');
      setMessage('Connection error. Retrying...');
    };

    setWs(websocket);
  };

  const handleWebSocketMessage = (data) => {
    console.log('Received message:', data);
    
    switch (data.type) {
      case 'authenticated':
        setMessage(data.message || 'Authenticated successfully! 💖');
        break;
        
      case 'queued':
        setConnectionState('queued');
        setQueuePosition(data.position);
        setMessage(data.message || `You're #${data.position} in queue 💫`);
        break;
        
      case 'match_found':
        setConnectionState('matched');
        setCallId(data.call_id);
        setPartnerId(data.partner_id);
        setMessage(data.message || 'Match found! Starting video call... 💕');
        // Automatically transition to call
        setTimeout(() => setConnectionState('in_call'), 2000);
        break;
        
      case 'call_ended':
        setConnectionState('connected');
        setCallId(null);
        setPartnerId(null);
        setMessage(data.message || 'Call ended 💔');
        break;
        
      case 'partner_disconnected':
        setConnectionState('connected');
        setCallId(null);
        setPartnerId(null);
        setMessage('Your partner disconnected 💔');
        break;
        
      case 'error':
        setMessage(`Error: ${data.message}`);
        break;
        
      default:
        console.log('Unhandled message type:', data.type);
    }
  };

  const joinQueue = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'join_queue'
      }));
      setMessage('Joining queue... Looking for someone special 💫');
    }
  };

  const leaveQueue = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'leave_queue'
      }));
      setConnectionState('connected');
      setMessage('Left queue 👋');
    }
  };

  const endCall = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'end_call'
      }));
    }
  };

  if (connectionState === 'in_call') {
    return (
      <div className="h-[100dvh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <VideoCall 
          ws={ws}
          callId={callId}
          partnerId={partnerId}
          onEndCall={endCall}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
              onlyMC
            </h1>
            <p className="text-purple-200">Anonymous video chat for Marian College</p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <span className="text-2xl">💖</span>
              <span className="text-sm text-purple-300">Made with love for MC students</span>
              <span className="text-2xl">💖</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white border-opacity-20">
            
            {/* Connection Status */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                connectionState === 'connected' ? 'bg-green-500 bg-opacity-20 text-green-300' :
                connectionState === 'connecting' ? 'bg-yellow-500 bg-opacity-20 text-yellow-300' :
                connectionState === 'queued' ? 'bg-blue-500 bg-opacity-20 text-blue-300' :
                connectionState === 'matched' ? 'bg-pink-500 bg-opacity-20 text-pink-300' :
                'bg-red-500 bg-opacity-20 text-red-300'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  connectionState === 'connected' ? 'bg-green-400' :
                  connectionState === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                  connectionState === 'queued' ? 'bg-blue-400 animate-pulse' :
                  connectionState === 'matched' ? 'bg-pink-400 animate-pulse' :
                  'bg-red-400'
                }`}></span>
                {connectionState === 'connected' ? 'Connected' :
                 connectionState === 'connecting' ? 'Connecting...' :
                 connectionState === 'queued' ? `In Queue (#${queuePosition})` :
                 connectionState === 'matched' ? 'Match Found!' :
                 'Disconnected'}
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className="text-center mb-6 p-3 bg-purple-500 bg-opacity-20 rounded-lg">
                <p className="text-sm text-purple-100">{message}</p>
              </div>
            )}

            {/* Auth Token Display */}
            <div className="bg-black bg-opacity-20 p-4 rounded-lg mb-6">
              <p className="text-xs text-purple-300 mb-1">Your MC Token:</p>
              <p className="font-mono text-xs text-white break-all">{authToken}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {connectionState === 'connected' && (
                <button
                  onClick={joinQueue}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 font-medium"
                >
                  <span className="text-xl">💕</span>
                  <span>Find Someone Special</span>
                  <span className="text-xl">💕</span>
                </button>
              )}

              {connectionState === 'queued' && (
                <div className="space-y-3">
                  <div className="text-center">
                    <Loading />
                    <p className="text-sm text-purple-300 mt-2">Looking for your perfect match...</p>
                  </div>
                  <button
                    onClick={leaveQueue}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Leave Queue
                  </button>
                </div>
              )}

              {connectionState === 'matched' && (
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-lg font-medium text-pink-300">Match Found!</p>
                  <p className="text-sm text-purple-300">Connecting to video call...</p>
                  <Loading />
                </div>
              )}

              {(connectionState === 'connected' || connectionState === 'queued') && (
                <button
                  onClick={logout}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 rounded-lg transition-colors"
                >
                  Logout
                </button>
              )}
            </div>

            {/* Connection Instructions */}
            {connectionState === 'disconnected' && (
              <div className="text-center mt-4">
                <p className="text-sm text-purple-300">
                  Make sure you have a valid Marian College token to connect
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-purple-400">
            <p>✨ Exclusive for Marian College students ✨</p>
            <p className="mt-1">Connect responsibly and spread love 💖</p>
          </div>
        </div>
      </div>
    </div>
  );
}
