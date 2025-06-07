import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getDistance } from 'geolib';
import './App.css';
import { paymentPoints } from './data/points';
import logo from './assets/al.jpg'; // Logo dosyasını içe aktar

// Haritayı filtrelenmiş marker'ların sınırlarına odaklayan bileşen
function MapBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = points.map((point) => point.coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);

  return null;
}

function App() {
  const [filters, setFilters] = useState({
    city: '',
    district: '',
    type: '',
  });
  const [userLocation, setUserLocation] = useState(null);
  const [nearestPoint, setNearestPoint] = useState(null);

  // Dinamik filtre seçenekleri
  const cities = [...new Set(paymentPoints.map((point) => point.city))].sort();
  const districts = [...new Set(paymentPoints.map((point) => point.district))].sort();
  const types = [...new Set(paymentPoints.map((point) => point.type))].sort();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Konum alınamadı:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      let minDistance = Infinity;
      let closestPoint = null;

      paymentPoints.forEach((point) => {
        const distance = getDistance(
          { latitude: userLocation.lat, longitude: userLocation.lng },
          { latitude: point.coordinates[0], longitude: point.coordinates[1] }
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      });

      setNearestPoint(closestPoint);
    }
  }, [userLocation]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredPoints = paymentPoints.filter((point) => {
    return (
      (filters.city === '' || point.city === filters.city) &&
      (filters.district === '' || point.district === filters.district) &&
      (filters.type === '' || point.type === filters.type)
    );
  });

  // Mesafe hesaplama fonksiyonu
  const calculateDistance = (point) => {
    if (!userLocation) return 'Mesafe hesaplanamadı';
    const distanceMeters = getDistance(
      { latitude: userLocation.lat, longitude: userLocation.lng },
      { latitude: point.coordinates[0], longitude: point.coordinates[1] }
    );
    return (distanceMeters / 1000).toFixed(1) + ' km';
  };

  return (
    <div className="App">
      <div className="filter-container">
        <select name="city" value={filters.city} onChange={handleFilterChange}>
          <option value="">Tüm Şehirler</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <select name="district" value={filters.district} onChange={handleFilterChange}>
          <option value="">Tüm Semtler</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">Tüm Türler</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      {userLocation && nearestPoint && (
        <div className="nearest-point">
          <img src={logo} alt="Logo" className="nearest-point-logo" />
          <div className="nearest-point-content">
            <h3>En Yakın Para Transfer Noktası</h3>
            <p>
              {nearestPoint.name} ({nearestPoint.city}, {nearestPoint.district})
            </p>
            <h>Detaylar: {nearestPoint.details}</h>
            <p>Mesafe: <span className="distance">{calculateDistance(nearestPoint)}</span></p>
          </div>
        </div>
      )}
      <div className="map-container">
        <MapContainer center={[41.0082, 28.9784]} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredPoints.map((point) => (
            <Marker key={point.id} position={point.coordinates}>
              <Popup>
                <h3>{point.name}</h3>
                <p>Şehir: {point.city}</p>
                <p>Semt: {point.district}</p>
                <p>Tür: {point.type}</p>
                <p>Detaylar: {point.details}, Mesafe: <span className="distance">{calculateDistance(point)}</span></p>
              </Popup>
            </Marker>
          ))}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Senin Konumun</Popup>
            </Marker>
          )}
          <MapBounds points={filteredPoints} />
        </MapContainer>
      </div>
    </div>
  );
}

export default App;