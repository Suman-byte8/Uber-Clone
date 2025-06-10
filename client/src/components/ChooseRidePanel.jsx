// Add this useEffect to your ChooseRidePanel component
useEffect(() => {
  if (!socket) {
    console.log("🚕 RIDER_VIEW: Socket not available");
    return;
  }

  console.log("🚕 RIDER_VIEW: Setting up socket listeners for ride responses");
  console.log("🚕 RIDER_VIEW: Current ride ID:", currentRideId);

  const handleRideAccepted = (data) => {
    console.log("🎉 RIDER_VIEW: ===== RIDE ACCEPTED EVENT RECEIVED =====");
    console.log("🎉 RIDER_VIEW: Full data received:", JSON.stringify(data, null, 2));
    console.log("🎉 RIDER_VIEW: Event ride ID:", data.rideId);
    console.log("🎉 RIDER_VIEW: Current ride ID:", currentRideId);
    
    if (data.rideId === currentRideId) {
      console.log("🎉 RIDER_VIEW: Ride IDs match! Updating booking state to ACCEPTED");
      console.log("🎉 RIDER_VIEW: Previous booking state:", bookingState);
      
      setBookingState("ACCEPTED");
      
      if (data.captainDetails) {
        console.log("🎉 RIDER_VIEW: Updating captain details:", data.captainDetails);
        setCaptainDetails(prev => ({
          ...prev,
          ...data.captainDetails
        }));
      }
      
      console.log("🎉 RIDER_VIEW: Booking state updated to ACCEPTED");
    } else {
      console.log("🚕 RIDER_VIEW: Ride IDs don't match, ignoring event");
    }
  };

  const handleRideRejected = (data) => {
    console.log("❌ RIDER_VIEW: ===== RIDE REJECTED EVENT RECEIVED =====");
    console.log("❌ RIDER_VIEW: Full data received:", JSON.stringify(data, null, 2));
    console.log("❌ RIDER_VIEW: Event ride ID:", data.rideId);
    console.log("❌ RIDER_VIEW: Current ride ID:", currentRideId);
    
    if (data.rideId === currentRideId) {
      console.log("❌ RIDER_VIEW: Ride IDs match! Driver rejected the ride");
      console.log("❌ RIDER_VIEW: Resetting to search for another driver");
      
      setBookingState("SEARCHING");
      setCaptainDetails(null);
    } else {
      console.log("❌ RIDER_VIEW: Ride IDs don't match, ignoring event");
    }
  };

  const handleAllSocketEvents = (eventName) => {
    return (data) => {
      console.log(`🔔 RIDER_VIEW: Socket event '${eventName}' received:`, data);
    };
  };

  // Listen for ride acceptance and rejection events
  socket.on("rideAccepted", handleRideAccepted);
  socket.on("rideRejected", handleRideRejected);
  
  // Debug: Listen to all socket events
  socket.on("connect", () => console.log("🔌 RIDER_VIEW: Socket connected"));
  socket.on("disconnect", () => console.log("🔌 RIDER_VIEW: Socket disconnected"));
  socket.on("error", handleAllSocketEvents("error"));

  return () => {
    console.log("🚕 RIDER_VIEW: Cleaning up socket listeners");
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
}, [bookingState, currentRideId, captainDetails, showPanel]);