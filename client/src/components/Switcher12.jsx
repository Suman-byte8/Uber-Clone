import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useUserContext } from '../context/UserContext'
import { useToast } from '../context/ToastContext'

const Switcher12 = ({ onStatusChange }) => {
  const [isChecked, setIsChecked] = useState(false)
  const { captainId } = useUserContext()
  const { showToast } = useToast()
  
  // Fetch initial status on component mount
  useEffect(() => {
    const fetchCaptainStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        const id = captainId || localStorage.getItem('captainId')
        
        if (!id || !token) return
        
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/captain/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        
        if (response.data.data && response.data.data.isActive !== undefined) {
          setIsChecked(response.data.data.isActive)
          // Notify parent component of initial status
          if (onStatusChange) {
            onStatusChange(response.data.data.isActive)
          }
        }
      } catch (error) {
        console.error('Error fetching captain status:', error)
      }
    }
    
    fetchCaptainStatus()
  }, [captainId, onStatusChange])

  const handleCheckboxChange = async () => {
    try {
      const token = localStorage.getItem('token')
      const id = captainId || localStorage.getItem('captainId')
      
      if (!id || !token) {
        showToast('Authentication required. Please log in again.', 'error')
        return
      }
      
      // Optimistic UI update
      const newStatus = !isChecked
      setIsChecked(newStatus)
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
      
      // Call API to update status
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/captain/${id}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      if (response.data.success) {
        showToast(`You are now ${newStatus ? 'Online' : 'Offline'}`,{
          type: 'success'
        } )
      } else {
        // Revert UI if API call fails
        setIsChecked(!newStatus)
        if (onStatusChange) {
          onStatusChange(!newStatus)
        }
        showToast('Failed to update status', 'error')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      // Revert UI on error
      setIsChecked(!isChecked)
      if (onStatusChange) {
        onStatusChange(!isChecked)
      }
      showToast('Error updating status. Please try again.', 'error')
    }
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