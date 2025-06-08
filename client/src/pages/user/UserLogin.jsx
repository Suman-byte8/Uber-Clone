import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/UserContext";
import { useSocketActions } from "../../context/SocketContext";

const UserLogin = () => {
    const { login } = useUserContext();
    const { connect } = useSocketActions();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/user/login`,
                { email, password }
            );

            const { token, user } = response.data;
            
            // Clean token before storing
            const cleanToken = token.replace('Bearer ', '').trim();
            
            // Update context with user info
            login(user, cleanToken, 'user');
            
            // Initialize socket connection
            await connect(cleanToken);

            setSuccess('Login successful!');
            
            // Navigate after successful connection
            setTimeout(() => {
                navigate('/user-home');
            }, 500);

        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-h-screen w-screen p-4">
            <h2 className="text-2xl font-bold mb-6">User Login</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col">
                    <label className="mb-2 font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="flex flex-col">
                    <label className="mb-2 font-medium">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                        required
                        disabled={isLoading}
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className={`bg-black text-white p-4 rounded-xl mt-4 text-xl font-medium transition-all duration-300 ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'
                    }`}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <p className="text-sm text-gray-600 mt-6 pb-3">
                Don't have an account? <Link to="/user-signup" className="text-blue-500 hover:text-blue-600">Sign up here</Link>
            </p>

            <p className="text-sm text-gray-600 mt-6 pb-3">
                By proceeding, you agree to Uber's Terms of Service and acknowledge that
                you have read our Privacy Policy.
            </p>
        </div>
    );
};

export default UserLogin;
