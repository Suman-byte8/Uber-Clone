import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const CaptainSignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    drivingLicense: {
      number: "",
      expiryDate: "",
    },
    vehicle: {
      make: "",
      model: "",
      year: "",
      color: "",
      licensePlate: "",
    },
  });
  const [error, setError] = useState("");
  // const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("drivingLicense.") || name.startsWith("vehicle.")) {
      const [field, subField] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { password, confirmPassword } = formData;

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(""); // Clear any previous error

    try {
      // Send the signup request to the backend
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/captain/signup`,
        {
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          drivingLicense: {
            number: formData.drivingLicense.number,
            expiryDate: formData.drivingLicense.expiryDate,
          },
          vehicle: {
            make: formData.vehicle.make,
            model: formData.vehicle.model,
            year: formData.vehicle.year,
            color: formData.vehicle.color,
            licensePlate: formData.vehicle.licensePlate,
          },
        }
      );

      if (response.status) {
        navigate("/captain-home");
      } // Handle successful signup (e.g., redirect or show a success message)
    } catch (error) {
      console.error("Error signing up:", error);
      setError("Signup failed. Please try again."); // Set error message for signup failure
    }
  };

  return (
    <div className="max-h-screen w-screen p-4">
      <h2 className="text-2xl font-bold mb-6">Sign up to become a captain</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
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
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
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
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
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
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
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
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Driving License Number</label>
          <input
            type="text"
            name="drivingLicense.number"
            value={formData.drivingLicense.number}
            onChange={handleChange}
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium">
            Driving License Expiry Date
          </label>
          <input
            type="date"
            name="drivingLicense.expiryDate"
            value={formData.drivingLicense.expiryDate}
            onChange={handleChange}
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Vehicle Make</label>
          <input
            type="text"
            name="vehicle.make"
            value={formData.vehicle.make}
            onChange={handleChange}
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Vehicle Model</label>
          <input
            type="text"
            name="vehicle.model"
            value={formData.vehicle.model}
            onChange={handleChange}
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Vehicle Year</label>
          <input
            type="number"
            name="vehicle.year"
            value={formData.vehicle.year}
            onChange={handleChange}
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Vehicle Color</label>
          <input
            type="text"
            name="vehicle.color"
            value={formData.vehicle.color}
            onChange={handleChange}
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 font-medium">License Plate Number</label>
          <input
            type="text"
            name="vehicle.licensePlate"
            value={formData.vehicle.licensePlate}
            onChange={handleChange}
            className="p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
            required
          />
        </div>
        {error && <p className="text-red-500">{error}</p>} Display error message
        {/* {success && <p className="text-green-500">{success}</p>} Display success message */}
        <button
          type="submit"
          className="bg-black text-white p-4 rounded-xl mt-4 text-xl font-medium"
        >
          Submit Application
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-6 pb-3">
        Already have an account?{" "}
        <Link to="/captain-login" className="text-blue-500">
          Login here
        </Link>
        .
      </p>
      <p className="text-sm text-gray-600 mt-6 pb-3">
        By proceeding, you agree to Uber's Terms of Service and acknowledge that
        you have read our Privacy Policy.
      </p>
    </div>
  );
};

export default CaptainSignUp;
