import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle click outside events for modals and dropdowns
 * @param {Function} handler - Function to call when clicking outside
 * @param {boolean} enabled - Whether the hook should be active (default: true)
 * @returns {Object} - Ref object to attach to the element
 */
export const useClickOutside = (handler, enabled = true) => {
  const ref = useRef();

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handler, enabled]);

  return ref;
};

export default useClickOutside;