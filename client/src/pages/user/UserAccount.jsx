import React from "react";
import Loader from "../../components/Loader";
import { useUserContext } from "../../components/UserContext";
import { useNavigate } from "react-router-dom";

const UserAccount = () => {
  const { userId, logout } = useUserContext();
  const navigate = useNavigate();
  const [profileData, setProfileData] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/user/account`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    };

    fetchData();
  }, []);

  // Add a loading state until profileData is available
  if (!profileData) {
    return <Loader />;
  }

  const handleLogout = () => {
    logout();
    navigate("/user-login");
  };

  return (
    <div className="w-screen h-screen p-4">
      <h2 className="text-xl font-semibold">Uber Account</h2>

      <h1 className="text-3xl font-bold py-5">Account Info</h1>

      <img
        src="https://th.bing.com/th/id/OIP.Sdwk-7MkBK1c_ap_eGCwxwHaHa?w=183&h=183&c=7&r=0&o=5&dpr=1.3&pid=1.7"
        alt=""
        className="w-24 h-24 rounded-full mb-6 p-1"
      />

      <h2 className="text-xl font-medium pb-4">Basic Info</h2>

      <div className="_name border-b-2 border-gray-300 flex items-center justify-between py-3">
        <div className="text-lg flex flex-col gap-1">
          <h2 className="font-semibold">Name</h2>
          <p className="font-light">{profileData.name}</p>
        </div>
        <i className="ri-arrow-drop-right-line text-2xl text-gray-500"></i>
      </div>

      <div className="_name border-b-2 border-gray-300 flex items-center justify-between py-3">
        <div className="text-lg flex flex-col gap-1">
          <h2 className="font-semibold">Phone number</h2>
          <p className="font-light flex items-center gap-1">
            {profileData.phoneNumber}{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="1em"
              height="1em"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M15.418 5.643a1.25 1.25 0 0 0-1.34-.555l-1.798.413a1.25 1.25 0 0 1-.56 0l-1.798-.413a1.25 1.25 0 0 0-1.34.555l-.98 1.564c-.1.16-.235.295-.395.396l-1.564.98a1.25 1.25 0 0 0-.555 1.338l.413 1.8a1.25 1.25 0 0 1 0 .559l-.413 1.799a1.25 1.25 0 0 0 .555 1.339l1.564.98c.16.1.295.235.396.395l.98 1.564c.282.451.82.674 1.339.555l1.798-.413a1.25 1.25 0 0 1 .56 0l1.799.413a1.25 1.25 0 0 0 1.339-.555l.98-1.564c.1-.16.235-.295.395-.395l1.565-.98a1.25 1.25 0 0 0 .554-1.34L18.5 12.28a1.25 1.25 0 0 1 0-.56l.413-1.799a1.25 1.25 0 0 0-.554-1.339l-1.565-.98a1.25 1.25 0 0 1-.395-.395zm-.503 4.127a.5.5 0 0 0-.86-.509l-2.615 4.426l-1.579-1.512a.5.5 0 1 0-.691.722l2.034 1.949a.5.5 0 0 0 .776-.107z"
                clipRule="evenodd"
              ></path>
            </svg>
          </p>
        </div>
        <i className="ri-arrow-drop-right-line text-2xl text-gray-500"></i>
      </div>

      <div className="_name border-b-2 border-gray-300 flex items-center justify-between py-3">
        <div className="text-lg flex flex-col gap-1">
          <h2 className="font-semibold">Email</h2>
          <p className="font-light flex items-center gap-1">
            {profileData.email}{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="1em"
              height="1em"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M15.418 5.643a1.25 1.25 0 0 0-1.34-.555l-1.798.413a1.25 1.25 0 0 1-.56 0l-1.798-.413a1.25 1.25 0 0 0-1.34.555l-.98 1.564c-.1.16-.235.295-.395.396l-1.564.98a1.25 1.25 0 0 0-.555 1.338l.413 1.8a1.25 1.25 0 0 1 0 .559l-.413 1.799a1.25 1.25 0 0 0 .555 1.339l1.564.98c.16.1.295.235.396.395l.98 1.564c.282.451.82.674 1.339.555l1.798-.413a1.25 1.25 0 0 1 .56 0l1.799.413a1.25 1.25 0 0 0 1.339-.555l.98-1.564c.1-.16.235-.295.395-.395l1.565-.98a1.25 1.25 0 0 0 .554-1.34L18.5 12.28a1.25 1.25 0 0 1 0-.56l.413-1.799a1.25 1.25 0 0 0-.554-1.339l-1.565-.98a1.25 1.25 0 0 1-.395-.395zm-.503 4.127a.5.5 0 0 0-.86-.509l-2.615 4.426l-1.579-1.512a.5.5 0 1 0-.691.722l2.034 1.949a.5.5 0 0 0 .776-.107z"
                clipRule="evenodd"
              ></path>
            </svg>
          </p>
        </div>
        <i className="ri-arrow-drop-right-line text-2xl text-gray-500"></i>
      </div>

      <button onClick={handleLogout} className="mt-4 flex items-center text-white bg-red-500 p-2 rounded">
        <i className="ri-logout-circle-line text-xl mr-2"></i>
        Logout
      </button>
    </div>
  );
};

export default UserAccount;
