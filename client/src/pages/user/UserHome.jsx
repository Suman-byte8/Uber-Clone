import React from "react";
import banner1 from "../../assets/ride_banner_1.jpeg";
import banner2 from "../../assets/ride_banner_2.jpeg";
import banner3 from "../../assets/ride_banner_3.jpeg";
import banner4 from "../../assets/ride_banner_4.jpeg";
import promoBanner1 from "../../assets/promo_banner_1.jpeg";
import promoBanner2 from "../../assets/promo_banner_2.jpeg";
import { Link } from "react-router-dom";

const UserHome = () => {
  return (
    <div className="w-full min-h-screen bg-[#2A3335] p-4 pb-[5rem] flex flex-col ">
      <img
        src="https://freelogopng.com/images/all_img/1659768779uber-logo-white.png"
        alt=""
        className="w-24 h-auto"
      />
      {/* Search bar */}
      <div className="_searchBar bg-[#3C474A] p-3 rounded-full flex items-center gap-4 my-6">
        <i className="ri-search-line text-2xl text-white font-semibold"></i>
        <input
          type="text"
          placeholder="Where to?"
          className="bg-transparent outline-none text-white w-full font-semibold text-xl"
        />
      </div>
      {/* Suggestions */}
      <div className="_suggestion w-full flex flex-col gap-6">
        <div className="flex w-full items-center justify-between text-white">
          <h1 className="font-semibold text-2xl">Suggestions</h1>
          <h3 className="font-base">See all</h3>
        </div>

        <div className="grid gap-4 grid-cols-2">
          <div className=" bg-[#dbdbdb3c] h-[6rem] rounded-xl">
            <Link to='/plan-trip' className="w-full h-[65%] flex justify-end items-end">
              <img
                src="https://www.pngplay.com/wp-content/uploads/8/Uber-PNG-Photos.png"
                alt=""
                className="w-28 object-contain"
              />
            </Link>
            <div className="w-full h-[35%] ">
              <span className="text-white font-medium text-md px-3">Trip</span>
            </div>
          </div>

          <div className=" bg-[#dbdbdb3c] h-[6rem] rounded-xl">
            <div className="w-full h-[65%] flex justify-end items-end">
              <img
                src="https://www.pngplay.com/wp-content/uploads/8/Uber-PNG-Photos.png"
                alt=""
                className="w-28 object-contain"
              />
            </div>
            <div className="w-full h-[35%] ">
              <span className="text-white font-medium text-md px-3">
                Intercity
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ride as you like it */}
      <div className="my-3 flex flex-col gap-3">
        <h1 className="font-semibold text-2xl text-white">
          Ride as you like it
        </h1>

        <div className="w-full overflow-x-scroll scroll-m-0">
          <div className="w-full flex gap-4">
            <div className="w-[70%] h-[14rem] flex-shrink-0 flex flex-col gap-3">
              <img
                src={banner1}
                alt=""
                className="w-full rounded-xl h-[9rem]"
              />
              <div>
                <h2 className="text-white text-xl font-medium">
                  Book Intercity <i className="ri-arrow-right-line"></i>
                </h2>
                <h4 className="text-gray-400 text-lg">
                  Travel outstation with ease
                </h4>
              </div>
            </div>

            <div className="w-[70%] h-[14rem] flex-shrink-0 flex flex-col gap-3">
              <img
                src={banner2}
                alt=""
                className="w-full rounded-xl h-[9rem]"
              />
              <div>
                <h2 className="text-white text-xl font-medium">
                  Book Premier <i className="ri-arrow-right-line"></i>
                </h2>
                <h4 className="text-gray-400 text-lg">
                  Extra comfort for special days
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Head out of Town */}
      <div className="my-3 flex flex-col gap-3">
        <h1 className="font-semibold text-2xl text-white">Head out of town</h1>

        <div className="w-full overflow-x-scroll scroll-m-0">
          <div className="w-full flex gap-4">
            <div className="w-[70%] h-[14rem] flex-shrink-0 flex flex-col gap-3">
              <img
                src={banner3}
                alt=""
                className="w-full rounded-xl h-[9rem]"
              />
              <div>
                <h2 className="text-white text-xl font-medium">
                  Request Intercity <i className="ri-arrow-right-line"></i>
                </h2>
                <h4 className="text-gray-400 text-lg">
                  Travel outstation effortlessly
                </h4>
              </div>
            </div>

            <div className="w-[70%] h-[14rem] flex-shrink-0 flex flex-col gap-3">
              <img
                src={banner4}
                alt=""
                className="w-full rounded-xl h-[9rem]"
              />
              <div>
                <h2 className="text-white text-xl font-medium">
                  Add multiple stops <i className="ri-arrow-right-line"></i>
                </h2>
                <h4 className="text-gray-400 text-lg">
                  As your travel plan evolve
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* promo image */}
      <div className="w-full flex overflow-scroll scroll-m-0 gap-4 ">
        <img
          src={promoBanner1}
          alt=""
          className="w-full rounded-xl duration-150"
        />
        <img
          src={promoBanner2}
          alt=""
          className="w-full rounded-xl duration-150"
        />
      </div>

      {/* nav footer */}
      <div className="footer-nav w-screen p-4 py-6 border-t-2 white fixed h-[4rem] bg-[#2A3335] bottom-0 left-0 flex items-center justify-between rounded-t-xl">
        {/* home */}
        <div className="home text-white flex flex-col items-center justify-center">
          <i className="ri-home-9-fill text-xl"></i>
          <p className="text-md font-medium">Home</p>
        </div>

        {/* services */}
        <div className="home text-white flex flex-col items-center justify-center">
          <i className="ri-customer-service-line text-xl"></i>
          <p className="text-md font-medium">Services</p>
        </div>

        {/* activity */}
        <div className="home text-white flex flex-col items-center justify-center">
          <i className="ri-booklet-fill text-xl"></i>
          <p className="text-md font-medium">Activity</p>
        </div>

        {/* account */}
        <Link to='/user-account' className="home text-white flex flex-col items-center justify-center">
          <i className="ri-user-fill text-xl"></i>
          <p className="text-md font-medium">Account</p>
        </Link>
      </div>
    </div>
  );
};

export default UserHome;
