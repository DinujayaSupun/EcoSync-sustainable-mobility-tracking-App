import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

const LocationAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  name, 
  label, 
  required = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await API.get('/commute/autocomplete', {
          params: { query: value }
        });
        
        if (data.success) {
          setSuggestions(data.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSuggestionClick = (suggestion) => {
    onChange({ target: { name, value: suggestion.display_name } });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-gray-700 font-medium mb-2">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        required={required}
        autoComplete="off"
      />
      
      {loading && (
        <div className="absolute right-3 top-11 text-gray-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="text-sm text-gray-800">{suggestion.display_name}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;
