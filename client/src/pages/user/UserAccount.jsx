import React from "react";
import Loader from "../../components/Loader";
import { useUserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { FaAngleLeft } from "react-icons/fa6";

const UserAccount = () => {
  const { userId, logout } = useUserContext();
  const navigate = useNavigate();
  const [profileData, setProfileData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/user/account`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
          }
        );
        if (!response.ok) {
          if (response.status === 401) {
            logout();
            navigate("/user-login");
            throw new Error("Session expired. Please login again.");
          }
          throw new Error("Failed to fetch account data");
        }
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        setError(error.message);
      }
    };
    fetchData();
  }, [logout, navigate]);

  if (error) {
    return (
      <div className="w-screen h-screen p-4 bg-gray-100">
        <div className="text-center mt-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => navigate("/user-login")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return <Loader />;
  }

  const handleLogout = () => {
    logout();
    navigate("/user-login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition duration-150 ease-in-out"
            aria-label="Go back"
          >
            <FaAngleLeft className="mr-2 h-5 w-5" />
            Back
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-red-600 hover:text-red-800 font-medium transition duration-150 ease-in-out"
          >
            <i className="ri-logout-circle-line text-xl mr-2"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-md mx-auto mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col items-center p-8">
          <img
            src="https://th.bing.com/th/id/OIP.Sdwk-7MkBK1c_ap_eGCwxwHaHa?w=183&h=183&c=7&r=0&o=5&dpr=1.3&pid=1.7"
            alt="Profile"
            className="w-28 h-28 rounded-full border-4 border-gray-200 shadow mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
          <p className="text-gray-500">{profileData.email}</p>
          <p className="text-gray-500">{profileData.phoneNumber}</p>
        </div>
        <div className="border-t border-gray-100 px-8 py-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Info</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Name</span>
              <span className="text-gray-900">{profileData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Phone Number</span>
              <span className="text-gray-900">{profileData.phoneNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Email</span>
              <span className="text-gray-900">{profileData.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccount;
