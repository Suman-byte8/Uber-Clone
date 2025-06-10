import React, { useState, useEffect } from 'react';
import { useUserContext } from '../../context/UserContext';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { FiEdit, FiLogOut, FiUser, FiTruck, FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi'; // Import FiArrowLeft

const CaptainProfile = () => {
  const navigate = useNavigate();
  const { captainId: contextCaptainId, logout: contextLogout } = useUserContext();
  const { captainId: paramsCaptainId } = useParams();
  const { showToast } = useToast();

  // Prioritize getting captainId from multiple sources
  const captainId = contextCaptainId || 
                    paramsCaptainId || 
                    localStorage.getItem('captainId') || 
                    null;

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
    isActive: false,
    totalTrips: 0, // Add defaults if needed
    earnings: 0   // Add defaults if needed
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Reset loading state
        setIsLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // Comprehensive ID and token validation
        if (!captainId) {
          showToast('No captain ID found. Please log in again.', 'error');
          navigate('/captain/login');
          return;
        }

        if (!token) {
          showToast('Authentication token missing. Please log in again.', 'error');
          navigate('/captain/login');
          return;
        }

        // Fetch profile with comprehensive error handling
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/captain/${captainId}`, 
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Ensure nested objects exist before setting state
        const fetchedData = response.data.data || {};
        const initialProfile = {
          ...profile,
          ...fetchedData,
          vehicle: fetchedData.vehicle || profile.vehicle,
          drivingLicense: fetchedData.drivingLicense || profile.drivingLicense,
        };

        setProfile(initialProfile);
        setEditedProfile(initialProfile);
      } catch (error) {
        console.error('Profile fetch error:', error);
        
        // Detailed error handling
        if (error.response) {
          switch (error.response.status) {
            case 401:
              showToast('Unauthorized. Please log in again.', 'error');
              navigate('/captain/login');
              break;
            case 404:
              showToast('Captain profile not found.', 'error');
              break;
            default:
              showToast('Failed to load profile. Please try again.', 'error');
          }
        } else {
          showToast('Network error. Please check your connection.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have a captainId
    if (captainId) {
      fetchProfile();
    } else {
      // If no captainId, redirect to login
      navigate('/captain/login');
    }
  }, [captainId, navigate, showToast]); // Added dependencies



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
      showToast('Profile updated successfully!', 'success'); // Show success toast
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile.', 'error'); // Show error toast
    }
  };

  // Define logout function for this component
  const handleLogout = () => {
    contextLogout(); // Call the logout function from context
    showToast('Logged out successfully.', 'success');
    // No need to navigate here if UserContext handles it
  };

  // Define go back function
    const handleGoBack = () => {
      navigate(-1); // Navigate to the previous page in history
    };


  // Add loading state check
  // Loading and error states
  if (!captainId) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-600">Error: Captain ID not found. Please log in.</div>;
  }
  if (isLoading) { // Use the isLoading state for more comprehensive loading check
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Helper function to format date (optional, adjust as needed)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 font-medium transition duration-150 ease-in-out"
            aria-label="Go back"
          >
            <FiArrowLeft className="mr-1 h-4 w-4" />
            Back
          </button>

          <h1 className="text-xl font-semibold text-gray-800">My Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-red-600 hover:text-red-800 font-medium transition duration-150 ease-in-out"
          >
            <FiLogOut className="mr-1 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Summary Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Placeholder for Profile Picture */}
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
              <FiUser size={40} />
            </div>
            <div className="flex-grow text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <div className="mt-2 flex items-center justify-center sm:justify-start space-x-2">
                <span className="text-yellow-500 font-semibold">{profile.rating?.toFixed(1) ?? 'N/A'} ⭐</span>
                <span className="text-gray-400">|</span>
                <span className="text-sm text-gray-600">{profile.totalTrips ?? 0} Trips</span>
              </div>
            </div>
            {/* Online Status Display */}
            <div className="flex flex-col items-center space-y-2">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${profile.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {profile.isActive ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
           {/* Earnings Stat */}
           <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
             <div className="flex justify-between items-center">
               <span className="text-sm font-medium text-gray-600">Total Earnings</span>
               <span className="text-lg font-semibold text-gray-900">₹{profile.earnings?.toLocaleString() ?? 'N/A'}</span>
             </div>
           </div>
        </div>

        {/* Edit Button */}
        {!isEditing && (
          <div className="mb-6 text-right">
            <button
              type="button"
              onClick={() => {
                setEditedProfile(JSON.parse(JSON.stringify(profile))); // Deep copy for editing
                setIsEditing(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <FiEdit className="-ml-1 mr-2 h-5 w-5" />
              Edit Profile
            </button>
          </div>
        )}

        {/* Profile Details Form/Display */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FiUser className="mr-2 text-gray-500"/> Personal Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
                {/* Name */}
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text" name="name" id="name"
                    value={isEditing ? (editedProfile.name ?? '') : (profile.name ?? '')}
                    onChange={handleInputChange} disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                  />
                </div>
                {/* Email */}
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email" name="email" id="email"
                    value={isEditing ? (editedProfile.email ?? '') : (profile.email ?? '')}
                    onChange={handleInputChange} disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                  />
                </div>
                {/* Phone */}
                <div className="sm:col-span-3">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel" name="phoneNumber" id="phoneNumber"
                    value={isEditing ? (editedProfile.phoneNumber ?? '') : (profile.phoneNumber ?? '')}
                    onChange={handleInputChange} disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                  />
                </div>
                 {/* Driving License Number */}
                 <div className="sm:col-span-3">
                   <label htmlFor="drivingLicense.number" className="block text-sm font-medium text-gray-700">Driving License No.</label>
                   <input
                     type="text" name="drivingLicense.number" id="drivingLicense.number"
                     value={isEditing ? (editedProfile.drivingLicense?.number ?? '') : (profile.drivingLicense?.number ?? '')}
                     onChange={handleInputChange} disabled={!isEditing}
                     className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                   />
                 </div>
                 {/* Driving License Expiry */}
                 <div className="sm:col-span-3">
                   <label htmlFor="drivingLicense.expiryDate" className="block text-sm font-medium text-gray-700">License Expiry Date</label>
                   <input
                     type={isEditing ? "date" : "text"} // Change type for editing
                     name="drivingLicense.expiryDate" id="drivingLicense.expiryDate"
                     value={isEditing ? formatDate(editedProfile.drivingLicense?.expiryDate) : formatDate(profile.drivingLicense?.expiryDate)}
                     onChange={handleInputChange} disabled={!isEditing}
                     className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                   />
                 </div>
              </div>
            </div>

            {/* Vehicle Information Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FiTruck className="mr-2 text-gray-500"/> Vehicle Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
                {/* Make */}
                <div className="sm:col-span-3">
                  <label htmlFor="vehicle.make" className="block text-sm font-medium text-gray-700">Make</label>
                  <input
                    type="text" name="vehicle.make" id="vehicle.make"
                    value={isEditing ? (editedProfile.vehicle?.make ?? '') : (profile.vehicle?.make ?? '')}
                    onChange={handleInputChange} disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                  />
                </div>
                {/* Model */}
                <div className="sm:col-span-3">
                  <label htmlFor="vehicle.model" className="block text-sm font-medium text-gray-700">Model</label>
                  <input
                    type="text" name="vehicle.model" id="vehicle.model"
                    value={isEditing ? (editedProfile.vehicle?.model ?? '') : (profile.vehicle?.model ?? '')}
                    onChange={handleInputChange} disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                  />
                </div>
                {/* Year */}
                <div className="sm:col-span-2">
                  <label htmlFor="vehicle.year" className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="number" name="vehicle.year" id="vehicle.year"
                    value={isEditing ? (editedProfile.vehicle?.year ?? '') : (profile.vehicle?.year ?? '')}
                    onChange={handleInputChange} disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                  />
                </div>
                {/* Color */}
                <div className="sm:col-span-2">
                  <label htmlFor="vehicle.color" className="block text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="text" name="vehicle.color" id="vehicle.color"
                    value={isEditing ? (editedProfile.vehicle?.color ?? '') : (profile.vehicle?.color ?? '')}
                    onChange={handleInputChange} disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                  />
                </div>
                {/* License Plate */}
                <div className="sm:col-span-2">
                  <label htmlFor="vehicle.licensePlate" className="block text-sm font-medium text-gray-700">License Plate</label>
                  <input
                    type="text" name="vehicle.licensePlate" id="vehicle.licensePlate"
                    value={isEditing ? (editedProfile.vehicle?.licensePlate ?? '') : (profile.vehicle?.licensePlate ?? '')}
                    onChange={handleInputChange} disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${isEditing ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500' : 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditedProfile({}); // Clear edits
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
              >
                 <FiXCircle className="-ml-1 mr-2 h-5 w-5 text-gray-500"/>
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
              >
                 <FiCheckCircle className="-ml-1 mr-2 h-5 w-5"/>
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CaptainProfile;