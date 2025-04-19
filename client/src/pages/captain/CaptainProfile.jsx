import React, { useState, useEffect } from 'react';
import { useUserContext } from '../../components/UserContext';
import { useParams } from 'react-router-dom'; // <-- Import useParams
import axios from 'axios';

const CaptainProfile = () => {
  const { captainId: contextCaptainId, logout } = useUserContext();
  const { captainId: paramsCaptainId } = useParams(); // <-- Get from params if available

  // Prefer context, fallback to params
  const captainId = contextCaptainId || paramsCaptainId;

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    vehicle: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: ''
    },
    drivingLicense: {
      number: '',
      expiryDate: ''
    },
    rating: 0,
    isActive: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/captain/${captainId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProfile(response.data.data);
        setEditedProfile(response.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (captainId) {
      fetchProfile();
    }
  }, [captainId]);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditedProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditedProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Remove these duplicate functions:
  // const handleSubmit = async (e) => { ... }
  // const toggleOnlineStatus = async () => { ... }
  
  // Keep only these (with token in headers):
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/captain/${captainId}`, editedProfile, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/captain/${captainId}/toggle-status`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProfile(prev => ({ ...prev, isActive: response.data.data.isActive }));
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Driver Profile</h1>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Online Status Toggle */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Online Status</h2>
                <p className="text-sm text-gray-500">
                  {profile.isOnline ? 'You are currently online and available for rides' : 'You are currently offline'}
                </p>
              </div>
              <button
                onClick={toggleOnlineStatus}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  profile.isOnline ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    profile.isOnline ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Trips</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{profile.totalTrips}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Rating</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{profile.rating.toFixed(1)} ⭐</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">₹{profile.earnings}</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={isEditing ? editedProfile.name : profile.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={isEditing ? editedProfile.email : profile.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={isEditing ? editedProfile.phoneNumber : profile.phoneNumber}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Make</label>
                    <input
                      type="text"
                      name="vehicle.make"
                      value={isEditing ? editedProfile.vehicle?.make : profile.vehicle?.make}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <input
                      type="text"
                      name="vehicle.model"
                      value={isEditing ? editedProfile.vehicle?.model : profile.vehicle?.model}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                      type="number"
                      name="vehicle.year"
                      value={isEditing ? editedProfile.vehicle?.year : profile.vehicle?.year}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <input
                      type="text"
                      name="vehicle.color"
                      value={isEditing ? editedProfile.vehicle?.color : profile.vehicle?.color}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Plate</label>
                    <input
                      type="text"
                      name="vehicle.licensePlate"
                      value={isEditing ? editedProfile.vehicle?.licensePlate : profile.vehicle?.licensePlate}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedProfile(profile);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CaptainProfile;