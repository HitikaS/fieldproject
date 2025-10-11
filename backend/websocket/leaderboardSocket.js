module.exports = (io) => {
  // Leaderboard namespace
  const leaderboardNamespace = io.of('/leaderboard');

  leaderboardNamespace.on('connection', (socket) => {
    console.log('Leaderboard client connected:', socket.id);

    // Listen for eco-point updates
    socket.on('ecoPointsUpdated', (data) => {
      leaderboardNamespace.emit('updateLeaderboard', data);
    });

    // Listen for donation/recyclable claimed events
    socket.on('itemClaimed', (data) => {
      leaderboardNamespace.emit('itemClaimedNotification', data);
    });

    socket.on('disconnect', () => {
      console.log('Leaderboard client disconnected:', socket.id);
    });
  });
};