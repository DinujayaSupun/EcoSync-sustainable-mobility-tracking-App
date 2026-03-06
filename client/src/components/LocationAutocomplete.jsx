import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

// Map Nominatim class/type → readable label + emoji
const getPlaceIcon = (cls, type) => {
  if (cls === 'amenity') {
    const amenityIcons = {
      restaurant: '🍽️', cafe: '☕', fast_food: '🍔', hospital: '🏥',
      pharmacy: '💊', school: '🏫', university: '🎓', bank: '🏦',
      fuel: '⛽', parking: '🅿️', bus_station: '🚌', train_station: '🚆',
      supermarket: '🛒', hotel: '🏨', place_of_worship: '🕌',
      police: '👮', fire_station: '🚒', library: '📚',
    };
    return amenityIcons[type] || '🏢';
  }
  if (cls === 'shop') return '🛍️';
  if (cls === 'tourism') return '🏛️';
  if (cls === 'leisure') return '🌳';
  if (cls === 'highway') return '🛣️';
  if (cls === 'railway') return '🚆';
  if (cls === 'aeroway') return '✈️';
  if (cls === 'place') return '📍';
  if (cls === 'boundary' || cls === 'landuse') return '🗺️';
  return '📍';
};

// Shorten display name: remove ", Sri Lanka" suffix and truncate if too long
const shortenName = (display_name) => {
  return display_name
    .replace(/, Sri Lanka$/, '')
    .replace(/, LK$/, '');
};

const LocationAutocomplete = ({ 
  value, 
  onChange, 
  onCoordSelect,
  placeholder, 
  name, 
  label, 
  required = false,
  apiEndpoint = '/commute/autocomplete' // Default endpoint, can be customized
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
        const { data } = await API.get(apiEndpoint, {
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
    if (onCoordSelect && suggestion.lat && suggestion.lon) {
      onCoordSelect(name, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-gray-700 font-medium mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-gray-400 text-lg">📍</span>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required={required}
          autoComplete="off"
        />
      </div>
      
      {loading && (
        <div className="absolute right-3 top-11 text-gray-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-72 overflow-y-auto shadow-xl">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-2.5 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg mt-0.5 shrink-0">
                  {getPlaceIcon(suggestion.class, suggestion.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {shortenName(suggestion.display_name).split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {shortenName(suggestion.display_name).split(',').slice(1).join(',').trim()}
                  </div>
                  {suggestion.type && (
                    <span className="inline-block text-xs text-green-600 bg-green-50 rounded px-1.5 py-0.5 mt-1 capitalize">
                      {suggestion.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && value.length >= 2 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg">
          <div className="px-4 py-3 text-center text-sm text-gray-500">
            No locations found. Try a different search term.
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
