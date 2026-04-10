import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by Vite/webpack bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Circle dot for start (like Google Maps A pin)
const startDotIcon = L.divIcon({
  html: `<div style="
    width:16px;height:16px;
    background:#1a73e8;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
});

// Teardrop destination pin (red)
const endPinIcon = L.divIcon({
  html: `<div style="position:relative;width:28px;height:36px;">
    <div style="
      width:28px;height:28px;
      background:#ea4335;
      border:3px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>
  </div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 34],
  className: '',
});

// Pulsing blue dot for live GPS location
const liveDotIcon = L.divIcon({
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="
        position:absolute;inset:0;
        background:rgba(26,115,232,0.25);
        border-radius:50%;
        animation:pulse-ring 1.6s ease-out infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:12px;height:12px;
        background:#1a73e8;
        border:2px solid #fff;
        border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
      "></div>
    </div>
    <style>
      @keyframes pulse-ring{
        0%{transform:scale(0.5);opacity:1}
        100%{transform:scale(2.2);opacity:0}
      }
    </style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  className: '',
});

// Auto-fit map bounds
const FitBounds = ({ startCoords, endCoords, routePoints }) => {
  const map = useMap();
  useEffect(() => {
    if (routePoints && routePoints.length > 1) {
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (startCoords && endCoords) {
      const bounds = L.latLngBounds([startCoords, endCoords]);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (startCoords) {
      map.setView(startCoords, 14);
    } else if (endCoords) {
      map.setView(endCoords, 14);
    }
  }, [startCoords, endCoords, routePoints, map]);
  return null;
};

// Locate-me button rendered inside the Leaflet map
const LocateControl = ({ onLocate }) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        map.setView([lat, lon], 15);
        // Reverse geocode with Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`
          );
          const data = await res.json();
          const name = data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          if (onLocate) onLocate(lat, lon, name);
        } catch {
          if (onLocate) onLocate(lat, lon, `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }
        setLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Unable to retrieve your location. Please allow location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div
      className="leaflet-top leaflet-right"
      style={{ marginTop: '80px', zIndex: 1000 }}
    >
      <div className="leaflet-control">
        <button
          onClick={handleLocate}
          disabled={locating}
          title="Use my live location"
          style={{
            background: '#fff',
            border: '2px solid rgba(0,0,0,0.2)',
            borderRadius: '4px',
            width: '34px',
            height: '34px',
            cursor: locating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 1px 5px rgba(0,0,0,0.25)',
          }}
        >
          {locating ? '⏳' : '📍'}
        </button>
      </div>
    </div>
  );
};

// Format seconds → "X min" or "X hr Y min"
const formatDuration = (seconds) => {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
};

// Format meters → "X.X km" or "X m"
const formatDistance = (meters) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

const CommuteMap = ({ startCoords, endCoords, startLabel, endLabel, transportType = 'Car', liveCoords, onLocate }) => {
  const [routePoints, setRoutePoints] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Map transport type to OSRM profile
  const osrmProfile = () => {
    const t = (transportType || 'Car').toLowerCase();
    if (t === 'bike') return 'bike';
    if (t === 'walk') return 'foot';
    return 'driving';
  };

  useEffect(() => {
    if (!startCoords || !endCoords) {
      setRoutePoints(null);
      setRouteInfo(null);
      return;
    }

    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        const profile = osrmProfile();
        const [sLat, sLon] = startCoords;
        const [eLat, eLon] = endCoords;
        const url = `https://router.project-osrm.org/route/v1/${profile}/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.code === 'Ok' && json.routes.length > 0) {
          const route = json.routes[0];
          // GeoJSON coords are [lon, lat] — convert to Leaflet [lat, lon]
          const pts = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          setRoutePoints(pts);
          setRouteInfo({
            distance: route.distance,
            duration: route.duration,
          });
        }
      } catch (e) {
        // Fall back to straight line if OSRM fails
        setRoutePoints([startCoords, endCoords]);
        console.error('Route fetch failed:', e);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [startCoords, endCoords, transportType]);

  // Sri Lanka center — default view
  const defaultCenter = [7.8731, 80.7718];

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-md relative" style={{ height: '420px' }}>
      {/* Route info card — Google Maps style */}
      {routeInfo && (
        <div className="absolute top-3 left-1/2 z-1000 -translate-x-1/2 flex gap-2 pointer-events-none">
          <div className="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-3 border border-gray-100">
            <span className="text-2xl">🚗</span>
            <div>
              <p className="text-base font-bold text-gray-900 leading-tight">
                {formatDuration(routeInfo.duration)}
              </p>
              <p className="text-xs text-gray-500">{formatDistance(routeInfo.distance)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {routeLoading && (
        <div className="absolute top-3 left-1/2 z-1000 -translate-x-1/2">
          <div className="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span className="text-sm text-gray-600">Finding route…</span>
          </div>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* Google Maps-like tile from CartoDB */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Route shadow (wider darker line underneath for depth) */}
        {routePoints && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#1557b0', weight: 10, opacity: 0.25, lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* Main route line — blue like Google Maps */}
        {routePoints && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#1a73e8', weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* Start dot marker */}
        {startCoords && (
          <Marker position={startCoords} icon={startDotIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-blue-700">🔵 Start</strong>
                <p className="mt-1 text-gray-600 max-w-45">{startLabel || 'Start Location'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* End pin marker */}
        {endCoords && (
          <Marker position={endCoords} icon={endPinIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-red-600">📍 Destination</strong>
                <p className="mt-1 text-gray-600 max-w-45">{endLabel || 'Destination'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live location pulsing dot */}
        {liveCoords && (
          <Marker position={liveCoords} icon={liveDotIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-blue-600">📍 Your Live Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Locate-me button inside map */}
        <LocateControl onLocate={onLocate} />

        <FitBounds startCoords={startCoords} endCoords={endCoords} routePoints={routePoints} />
      </MapContainer>
    </div>
  );
};

export default CommuteMap;
