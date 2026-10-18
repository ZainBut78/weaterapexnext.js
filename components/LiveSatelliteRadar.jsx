'use client';

import { useEffect } from 'react';
// Leaflet ki CSS sirf map ke saath (pehle root layout mein — har page par
// render-blocking CSS; perf fixes Oct 2026)
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
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

// Sirf Leaflet map (LiveSatelliteRadarLazy.jsx is ko section ke andar, screen
// ke qareeb aane par, alag chunk mein mangwata hai). Heading/subtitle wahan.
export default function LeafletMap({ data }) {
  const units = useUnits(); // °C/°F (audit 3.2)
  const position = [data.latitude, data.longitude];
  return (
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
  );
}
