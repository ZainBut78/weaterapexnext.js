'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useCity } from '../context/CityContext';
import { useCurrentWeather } from '../hooks/useWeather';
import { RadarSkeleton } from './HomeSkeletons';
import { useUnits } from '../context/UnitsContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function FlyToCity({ position }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 11, { duration: 1.5 });
  }, [map, position]);
  return null;
}

const LiveSatelliteRadar = () => {
  const { city } = useCity();
  const { data, isLoading } = useCurrentWeather(city);
  const units = useUnits(); // °C/°F (audit 3.2)

  // Skeleton mein "Weather Map" heading ki jagah bhi — warna data aane
  // par 84px ka jhatka (CLS fix — HomeSkeletons.jsx)
  if (isLoading || !data) {
    return <RadarSkeleton />;
  }

  const position = [data.latitude, data.longitude];

  return (
    <div className="w-full bg-[#0f172a] py-10">
      <div className="max-w-[1000px] mx-auto px-4 font-sans">
        
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Weather Map
          </h2>
          <p className="text-sm text-slate-300 font-medium mt-1">
            {data.city}, {data.country} &mdash; {units.temp1(data.current.temperature_2m)}{units.tempSymbol} &bull; Precipitation Radar
          </p>
        </div>

        <div className="relative w-full h-[420px] rounded-3xl border border-slate-700/60 shadow-inner overflow-hidden">
          <MapContainer
            center={position}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <FlyToCity position={position} />

            <LayersControl position="topright">
              <LayersControl.BaseLayer name="Dark">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer checked name="Satellite">
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              </LayersControl.BaseLayer>
            </LayersControl>

            <TileLayer
              url="https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/2/1_1.png"
              opacity={0.45}
            />

            <Marker position={position}>
              <Popup>
                <strong>{data.city}</strong><br />
                {units.temp1(data.current.temperature_2m)}{units.tempSymbol}
              </Popup>
            </Marker>
          </MapContainer>
        </div>

      </div>
    </div>
  );
};

export default LiveSatelliteRadar;
