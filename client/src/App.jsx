import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://improved-pancake-4qw7gv6wpw6q25q5j-5000.app.github.dev', {
  transports: ['websocket', 'polling']
});

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const myVideoRef = useRef();
  const streamRef = useRef();

  useEffect(() => {
    // 1. Camera & Mic Access
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.log('Camera error:', err));

    // 2. Socket Join & Listen
    socket.emit('join-room', 'general-room', socket.id);

    socket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.disconnect();
  }, []);

  // Send Chat Message
  const handleSend = (e) => {
  e.preventDefault();
  if (!inputMsg.trim()) return;

  const msgData = { text: inputMsg, time: new Date().toLocaleTimeString() };

  // Screen par turant message render karne ke liye
  setMessages((prev) => [...prev, msgData]);

  // Server socket par send karne ke liye
  socket.emit('send-message', msgData);

  setInputMsg('');
};

  // Toggle Mute Audio
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video On/Off
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Screen Share
  const handleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = screenStream;
      }
      screenStream.getVideoTracks()[0].onended = () => {
        if (myVideoRef.current && streamRef.current) {
          myVideoRef.current.srcObject = streamRef.current;
        }
      };
    } catch (err) {
      console.log('Screen sharing cancelled:', err);
    }
  };

  // End Call & Generate AI Summary
  const handleEndCall = async () => {
    setLoadingSummary(true);
    // Meeting ke chat/transcripts ko summary ke liye bhejna
    const transcriptText = messages.map(m => m.text).join('. ') || "Sprint review and roadmap planning discussed.";

    try {
      const response = await fetch('https://improved-pancake-4qw7gv6wpw6q25q5j-5000.app.github.dev/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText })
      });
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', background: '#090d16', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#38bdf8' }}>IntelliMeet AI Collaboration Platform</h2>
        <span style={{ background: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>LIVE</span>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Left Side: Video & Controls */}
        <div style={{ flex: 2, background: '#131b2e', padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', width: '100%', height: '420px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            <video 
              ref={myVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            {isVideoOff && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#94a3b8' }}>
                Camera is Turned Off
              </div>
            )}
          </div>

          {/* Meeting Action Controls */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '15px' }}>
            <button onClick={toggleAudio} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', background: isAudioMuted ? '#ef4444' : '#334155', color: '#fff', cursor: 'pointer' }}>
              {isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
            </button>
            <button onClick={toggleVideo} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', background: isVideoOff ? '#ef4444' : '#334155', color: '#fff', cursor: 'pointer' }}>
              {isVideoOff ? 'Start Video' : 'Stop Video'}
            </button>
            <button onClick={handleScreenShare} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer' }}>
              Share Screen
            </button>
            <button onClick={handleEndCall} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              End Call & Get AI Summary
            </button>
          </div>
        </div>

        {/* Right Side: Chat */}
        <div style={{ flex: 1, background: '#131b2e', padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>Meeting Chat</h3>
          <div style={{ flex: 1, height: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 && <p style={{ color: '#64748b', fontSize: '13px' }}>No messages yet. Type below to chat...</p>}
            {messages.map((m, i) => (
              <div key={i} style={{ background: '#1e293b', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>{m.time}</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{m.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input 
              type="text" 
              value={inputMsg} 
              onChange={(e) => setInputMsg(e.target.value)} 
              placeholder="Send message..." 
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#090d16', color: '#fff' }} 
            />
            <button type="submit" style={{ padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </div>
      </div>

      {/* AI Summary Modal / Section */}
      {loadingSummary && <p style={{ textAlign: 'center', marginTop: '20px', color: '#38bdf8' }}>AI is summarizing meeting notes and extracting action items...</p>}
      
      {summary && (
        <div style={{ marginTop: '30px', background: '#131b2e', padding: '20px', borderRadius: '12px', border: '1px solid #38bdf8' }}>
          <h3 style={{ color: '#38bdf8', marginTop: 0 }}>🤖 AI Meeting Summary & Action Items</h3>
          <p style={{ lineHeight: '1.6' }}><strong>Summary:</strong> {summary.summary}</p>
          <h4 style={{ marginBottom: '8px' }}>Extracted Action Items:</h4>
          <ul>
            {summary.actionItems.map((item, idx) => (
              <li key={idx} style={{ margin: '6px 0', color: '#a5f3fc' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
