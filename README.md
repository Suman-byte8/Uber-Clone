# React + Vite + Express Setup

This project provides a minimal setup integrating React with Vite for frontend development and Express for the backend server.

## Project Structure

- **client/**: Contains the Vite frontend application.
- **server/**: Contains the Express backend server.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Set up the Vite frontend**:
   Navigate to the `client` directory and install dependencies:
   ```bash
   cd client
   npm install
   ```

3. **Set up the Express backend**:
   Navigate to the `server` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `server` directory:
   ```plaintext
   PORT=3000
   ```

### Running the Application

1. **Start the Express server**:
   Navigate to the `server` directory and run:
   ```bash
   node server.js
   ```

2. **Start the Vite development server**:
   Navigate to the `client` directory and run:
   ```bash
   npm run dev
   ```

