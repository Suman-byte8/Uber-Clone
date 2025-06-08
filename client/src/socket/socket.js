import io from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';
    socket = io(baseUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    // Add connection event listeners
    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const reconnectSocket = () => {
  return new Promise((resolve, reject) => {
    try {
      if (socket) {
        // If socket exists but is disconnected, reconnect it
        if (!socket.connected) {
          console.log('Attempting to reconnect existing socket...');
          socket.connect();
          
          // Wait for connection or timeout
          const timeout = setTimeout(() => {
            reject(new Error('Socket reconnection timeout'));
          }, 5000);

          socket.once('connect', () => {
            clearTimeout(timeout);
            console.log('Socket reconnected successfully');
            resolve(socket);
          });

          socket.once('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        } else {
          // Socket is already connected
          console.log('Socket is already connected');
          resolve(socket);
        }
      } else {
        // Create new socket connection
        console.log('Creating new socket connection...');
        socket = initSocket();
        
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 5000);

        socket.once('connect', () => {
          clearTimeout(timeout);
          console.log('New socket connected successfully');
          resolve(socket);
        });

        socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const forceReconnectSocket = () => {
  return new Promise((resolve, reject) => {
    try {
      // Disconnect existing socket if it exists
      if (socket) {
        socket.disconnect();
        socket = null;
      }

      // Create fresh socket connection
      console.log('Force creating new socket connection...');
      const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';
      socket = io(baseUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true, // Force a new connection
      });

      const timeout = setTimeout(() => {
        reject(new Error('Force socket reconnection timeout'));
      }, 5000);

      socket.once('connect', () => {
        clearTimeout(timeout);
        console.log('Socket force reconnected successfully:', socket.id);
        resolve(socket);
      });

      socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('Socket force reconnection error:', error);
        reject(error);
      });

      // Add the standard event listeners
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

    } catch (error) {
      reject(error);
    }
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};