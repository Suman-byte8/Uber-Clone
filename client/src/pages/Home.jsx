import React from "react";
import { Link } from 'react-router-dom';
const Home = () => {
  return (
    <div className="h-screen w-screen p-4 bg-[#006BFF] flex flex-col items-center justify-around">
      <img
        src="https://freelogopng.com/images/all_img/1659768779uber-logo-white.png"
        alt=""
        className="w-28 h-auto"
      />

      <img
        src="https://ubernewsroomapi.10upcdn.com/wp-content/uploads/2020/08/Driver_Rider_Mask-1-625x630.png"
        alt=""
        className="w-[250px] h-auto"
      />

      <h1 className="text-white font-semibold text-4xl">Move With Safety</h1>

      <Link to='/signup' className='bg-black w-full  p-5 rounded-xl text-white flex items-center justify-between text-xl font-medium'>Get started <i className="ri-arrow-right-line text-2xl"></i></Link>
    </div>
  );
};

export default Home;
