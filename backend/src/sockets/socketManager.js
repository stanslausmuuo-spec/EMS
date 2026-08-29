const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join event room for live check-in stats
    socket.on('joinEventRoom', (eventId) => {
      socket.join(eventId);
      console.log(`Socket ${socket.id} joined event room: ${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
