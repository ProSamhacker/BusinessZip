'use client';

import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues with Leaflet
const CompetitorMap = dynamic(() => import('./CompetitorMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default CompetitorMap;

