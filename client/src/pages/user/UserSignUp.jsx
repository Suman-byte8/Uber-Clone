import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserSignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phoneNumber, password, confirmPassword } = formData;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(""); // Clear previous errors
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/user/signup",
        { name, email, phoneNumber, password }
      );
      console.log("Signup successful:", response.data);
      if(response.status==201){
        const token = response.data.token;
        localStorage.setItem("userToken", token);
        navigate('/user-home')
      }
      // Handle success (e.g., redirect or success message)
    } catch (err) {
      console.error("Error during signup:", err);
      setError("Signup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-h-screen w-screen p-4">
      <h2 className="text-2xl font-bold mb-6">Sign up to ride with Uber</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <button
          type="submit"
          className="bg-black text-white p-4 rounded-xl mt-4 text-xl font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Sign Up"}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-6 pb-3">
        By proceeding, you agree to Uber's Terms of Service and acknowledge that
        you have read our Privacy Policy.
      </p>
    </div>
  );
};

export default UserSignUp;
