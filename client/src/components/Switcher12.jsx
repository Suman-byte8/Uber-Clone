import React, { useState } from 'react'

const Switcher12 = () => {
  const [isChecked, setIsChecked] = useState(false)

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked)
  }

  return (
    <>
      <button
        onClick={handleCheckboxChange}
        className="relative w-32 h-10 rounded-full transition-colors duration-300 ease-in-out flex items-center justify-between px-4 shadow-md"
        style={{
          backgroundColor: isChecked ? '#4287f5' : '#e2e8f0'
        }}
      >
        {/* Background text */}
        <span 
          className={`absolute text-sm font-medium transition-opacity duration-300 ${
            isChecked 
              ? 'right-11 text-white opacity-100' 
              : 'left-11 text-gray-500 opacity-100'
          }`}
        >
          {isChecked ? 'Online' : 'Offline'}
        </span>

        {/* Sliding circle with taxi icon */}
        <div
          className={`absolute w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 ease-in-out ${
            isChecked ? 'left-[calc(100%-38px)]' : 'left-1'
          }`}
        >
          <i className={`ri-taxi-line text-lg ${
            isChecked ? 'text-blue-500' : 'text-gray-400'
          }`} />
        </div>
      </button>
    </>
  )
}

export default Switcher12