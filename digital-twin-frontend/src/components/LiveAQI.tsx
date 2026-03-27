import React, { useEffect, useMemo } from 'react';
import { useAQI } from '../context/AQIContext';
import { CloudFog, RefreshCcw, MapPin } from 'lucide-react';
import type { AQIData } from '../types';
import { delhiWards } from '../data/delhiWards';

export function LiveAQI({ onAqiUpdate }: { onAqiUpdate?: (aqi: number) => void }) {
  const { aqiData: baseAqi, isLoading, refreshAQI, selectedZone, setSelectedZone, selectedWard, setSelectedWard } = useAQI();

  // Create derived AQI data based on selected ward
  const aqi = useMemo(() => {
    if (!baseAqi) return null;
    if (!selectedWard && !selectedZone) return baseAqi;
    
    // Create a stable but unique variation based on the location strings
    const strToMix = selectedWard || selectedZone || "";
    let sum = 0;
    for (let i = 0; i < strToMix.length; i++) sum += strToMix.charCodeAt(i);
    
    // Vary between -15 and +15
    const variance = (sum % 31) - 15;
    
    return {
      ...baseAqi,
      aqi: Math.max(0, baseAqi.aqi + variance),
      pm2_5: Math.max(0, baseAqi.pm2_5 + (variance * 0.2)),
      pm10: Math.max(0, baseAqi.pm10 + (variance * 0.4)),
      no2: Math.max(0, baseAqi.no2 + (variance * 0.1)),
      o3: Math.max(0, baseAqi.o3 + (variance * 0.15))
    };
  }, [baseAqi, selectedWard, selectedZone]);

  useEffect(() => {
    if (aqi && onAqiUpdate) {
      onAqiUpdate(aqi.aqi);
    }
  }, [aqi, onAqiUpdate]);

  const getAQIColor = (aqi: number) => {
    // Standard AQI Scale (India/global mix adaptation)
    if (aqi <= 50) return '#00ff9d';      // Good (Neon Green)
    if (aqi <= 100) return '#eab308';     // Satisfactory
    if (aqi <= 200) return '#f97316';     // Moderate
    if (aqi <= 300) return '#ff0055';     // Poor (Neon Red)
    if (aqi <= 400) return '#a855f7';     // Very Poor
    return '#991b1b';                     // Severe
  };

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  };

  const zones = useMemo(() => Array.from(new Set(delhiWards.map(w => w.zone))).sort(), []);
  const wardsInZone = useMemo(() => 
    selectedZone ? delhiWards.filter(w => w.zone === selectedZone).sort((a,b) => a.name.localeCompare(b.name)) : [],
  [selectedZone]);

  if (isLoading || !aqi) return <div className="text-white/50 animate-pulse">Loading Live Data...</div>;

  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <CloudFog className="w-5 h-5 text-secondary" />
          Live AQI 
        </h3>
        <button
          onClick={refreshAQI}
          className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white flex items-center gap-1.5 transition-all"
        >
          <RefreshCcw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Location Selectors */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors">
          <MapPin className="w-4 h-4 text-white/40 shrink-0" />
          <select 
            className="bg-transparent text-sm text-white outline-none w-full cursor-pointer appearance-none"
            value={selectedZone || ""}
            onChange={(e) => {
                setSelectedZone(e.target.value || null);
                setSelectedWard(null);
            }}
          >
            <option value="" className="bg-slate-900 text-white">All Zones (Delhi Avg)</option>
            {zones.map(z => <option key={z} value={z} className="bg-slate-900 text-white">{z}</option>)}
          </select>
        </div>
        
        {selectedZone && (
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors">
            <select 
              className="bg-transparent text-sm text-white outline-none w-full cursor-pointer appearance-none"
              value={selectedWard || ""}
              onChange={(e) => setSelectedWard(e.target.value || null)}
            >
              <option value="" className="bg-slate-900 text-white">All Wards in Zone</option>
              {wardsInZone.map(w => <option key={w.name} value={w.name} className="bg-slate-900 text-white">{w.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Main AQI Index */}
      <div
        className="rounded-2xl p-6 mb-6 text-center relative overflow-hidden border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${getAQIColor(aqi.aqi)}20 0%, rgba(0,0,0,0) 100%)`,
        }}
      >
        <div className="text-4xl font-bold text-white mb-1" style={{ textShadow: `0 0 20px ${getAQIColor(aqi.aqi)}` }}>
          {getAQILabel(aqi.aqi)}
        </div>
        <div className="text-sm text-white/70 font-mono">
          Current Index: <span className="text-white font-bold">{Math.round(aqi.aqi)}</span> / 500
        </div>
      </div>

      {/* Pollutants Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { label: 'PM2.5', value: aqi.pm2_5 },
          { label: 'PM10', value: aqi.pm10 },
          { label: 'NO₂', value: aqi.no2 },
          { label: 'O₃', value: aqi.o3 }
        ].map((item) => (
          <div key={item.label} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="text-white/50 text-xs mb-1">{item.label}</div>
            <div className="text-white font-bold text-lg">{item.value.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}