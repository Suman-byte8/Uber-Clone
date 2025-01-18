import React from "react";
import Loader from "../../components/Loader";

const UserAccount = () => {
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
          <p className="font-light">{profileData.phoneNumber}</p>
        </div>
        <i className="ri-arrow-drop-right-line text-2xl text-gray-500"></i>
      </div>

      <div className="_name border-b-2 border-gray-300 flex items-center justify-between py-3">
        <div className="text-lg flex flex-col gap-1">
          <h2 className="font-semibold">Email</h2>
          <p className="font-light">{profileData.email}</p>
        </div>
        <i className="ri-arrow-drop-right-line text-2xl text-gray-500"></i>
      </div>
    </div>
  );
};

export default UserAccount;
