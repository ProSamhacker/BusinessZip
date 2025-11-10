'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface CompetitorLocation {
  lat: number;
  lon: number;
}

interface CompetitorMapProps {
  locations: CompetitorLocation[];
  center?: { lat: number; lon: number };
  businessTerm: string;
}

export default function CompetitorMap({ locations, center, businessTerm }: CompetitorMapProps) {
  // Calculate center from locations if not provided
  const mapCenter = center || (locations.length > 0
    ? {
        lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
        lon: locations.reduce((sum, loc) => sum + loc.lon, 0) / locations.length,
      }
    : { lat: 37.7749, lon: -122.4194 }); // Default to San Francisco

  if (locations.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No competitor locations available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lon]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location, index) => (
          <Marker key={index} position={[location.lat, location.lon]}>
            <Popup>
              {businessTerm} #{index + 1}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

