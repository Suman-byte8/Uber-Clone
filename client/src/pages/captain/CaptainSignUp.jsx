import React, { useState } from "react";
import { Link } from "react-router-dom";

const CaptainSignUp = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    vehicleType: "",
    vehicleModel: "",
    vehicleCapacity:"",
    vehicleYear: "",
    licensePlate: "",
    driverLicense: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
  };

  return (
    <div className="max-h-screen w-screen p-4">

      <h2 className="text-2xl font-bold mb-6">Sign up to become a captain</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="mb-2 font-medium">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
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
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Vehicle Type</label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          >
            <option value="">Select vehicle type</option>
            <option value="sedan">Motorcycle</option>
            <option value="suv">Car</option>
            <option value="van">Auto</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Vehicle Model</label>
          <input
            type="text"
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Vehicle Capacity</label>
          <input
            type="text"
            name="vehicleModel"
            value={formData.vehicleCapacity}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Vehicle Year</label>
          <input
            type="number"
            name="vehicleYear"
            value={formData.vehicleYear}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">License Plate Number</label>
          <input
            type="text"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium">Driver License Number</label>
          <input
            type="text"
            name="driverLicense"
            value={formData.driverLicense}
            onChange={handleChange}
            className="p-3 border-2 rounded-lg"
            required
          />
        </div>

        <button 
          type="submit"
          className="bg-black text-white p-4 rounded-xl mt-4 text-xl font-medium"
        >
          Submit Application
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-6 pb-3">
        By proceeding, you agree to Uber's Terms of Service and acknowledge that you have read our Privacy Policy.
      </p>
    </div>
  );
};

export default CaptainSignUp;
