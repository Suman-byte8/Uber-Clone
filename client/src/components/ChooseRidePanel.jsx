useEffect(() => {
  if (!socket) {
    console.log("🚕 RIDER_VIEW: Socket not available");
  }

  console.log("🚕 RIDER_VIEW: Setting up socket listeners for ride responses");
  console.log("🚕 RIDER_VIEW: Current ride ID:", currentRideId);
    console.log("🎉 RIDER_VIEW: ===== RIDE ACCEPTED EVENT RECEIVED =====");
    console.log("🎉 RIDER_VIEW: Full data received:", JSON.stringify(data, null, 2));
    console.log("🎉 RIDER_VIEW: Event ride ID:", data.rideId);
    console.log("🎉 RIDER_VIEW: Current ride ID:", currentRideId);
    console.log("❌ RIDER_VIEW: Current ride ID:", currentRideId);
    
    if (data.rideId === currentRideId) {
      console.log("❌ RIDER_VIEW: Ride IDs match! Driver rejected the ride");
  // Listen for ride acceptance and rejection events
  socket.on("rideAccepted", handleRideAccepted);
  socket.on("rideRejected", handleRideRejected);
  
  // Debug: Listen to all socket events
  socket.on("connect", () => console.log("🔌 RIDER_VIEW: Socket connected"));
    socket.off("rideAccepted", handleRideAccepted);
    socket.off("rideRejected", handleRideRejected);
  };
}, [socket, currentRideId, bookingState]);

// Add this useEffect to track state changes
useEffect(() => {
  console.log("📊 RIDER_VIEW: State changed:");
  console.log("📊 RIDER_VIEW: - Booking State:", bookingState);
  console.log("📊 RIDER_VIEW: - Current Ride ID:", currentRideId);
  console.log("📊 RIDER_VIEW: - Captain Details:", captainDetails);
  console.log("📊 RIDER_VIEW: - Show Panel:", showPanel);
