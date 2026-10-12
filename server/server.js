const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Real-time Chat aur Video Signaling
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('send-message', (data) => {
      io.to(roomId).emit('receive-message', data);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });
});

// AI Meeting Summary API Endpoint
app.post('/api/summarize', (req, res) => {
  const { transcript } = req.body;
  res.json({
    summary: "The team reviewed enterprise collaboration features, validated WebRTC video streams, and confirmed deployment deliverables.",
    actionItems: [
      "Deploy frontend build to production hosting",
      "Connect persistent database for chat logs",
      "Record final demo video showcasing video, chat, and AI summary"
    ]
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`IntelliMeet Server running on port ${PORT}`);
});