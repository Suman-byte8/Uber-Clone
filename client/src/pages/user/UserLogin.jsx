import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../../components/UserContext";

const UserLogin = () => {
    const { login } = useUserContext(); // Change this line to get login function
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/user/login`, {
                email,
                password
            });

            setSuccess('Login successful!');
            const userId = response.data._id;
            login(response.data.token, userId, 'user'); // Use the login function instead
            navigate('/user-home');
        } catch (error) {
            console.error('Error logging in:', error);
            setError('Invalid email or password. Please try again.');
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
                        className="p-3 border-2 border-gray-300 rounded-lg"
                        required
                    />
                </div>

                <div className="flex flex-col">
                    <label className="mb-2 font-medium">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 border-2 border-gray-300 rounded-lg"
                        required
                    />
                </div>

                {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                {success && <p className="text-green-500">{success}</p>} {/* Display success message */}

                <button 
                    type="submit"
                    className="bg-black text-white p-4 rounded-xl mt-4 text-xl font-medium"
                >
                    Login
                </button>
            </form>

            <p className="text-sm text-gray-600 mt-6 pb-3">
                Don't have an account? <Link to="/user-signup" className="text-blue-500">Sign up here</Link>.
            </p>

            <p className="text-sm text-gray-600 mt-6 pb-3">
                By proceeding, you agree to Uber's Terms of Service and acknowledge that
                you have read our Privacy Policy.
            </p>
        </div>
    );
};

export default UserLogin;
