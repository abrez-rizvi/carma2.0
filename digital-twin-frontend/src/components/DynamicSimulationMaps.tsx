"use client";

import { useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { MapPanelCard } from './MapPanel';
import type { ScenarioResult } from '../context/GlobalStateContext';

interface DynamicSimulationMapsProps {
    result: ScenarioResult | null;
}

export function DynamicSimulationMaps({ result }: DynamicSimulationMapsProps) {
    const queryParams = useMemo(() => {
        if (!result) return '';
        const params = new URLSearchParams();
        params.append('aqi_improvement_pct', result.metrics.aqiImprovement.toString());
        
        Object.entries(result.metrics.sectorEmissions).forEach(([sector, value]) => {
            params.append(sector, value.toString());
        });
        
        return '?' + params.toString();
    }, [result]);

    const qs = queryParams;

    if (!result) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 mt-12 mb-12">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                </span>
                Spatial Impact Visualization
            </h3>
            <p className="text-white/40 text-sm mb-6 max-w-2xl">
                These interactive maps dynamically reflect the reductions calculated in the current policy scenario. 
                Explore how the sector-specific emissions and overall AQI intensity shift across the city.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <MapPanelCard
                    title="Simulated Ward AQI Map"
                    icon={<span role="img" aria-label="ward">🏘️</span>}
                    imageSrc={`${API_BASE_URL}/api/aqi-map/ward-geojson.png${qs}`}
                    imageAlt="Ward AQI Map"
                    interactiveUrl={`${API_BASE_URL}/api/aqi-map/ward-geojson${qs}`}
                    caption="Simulated ward-level AQI choropleth based on applied policy improvements."
                    onRefresh={() => {}}
                    isLoading={false}
                />
                <MapPanelCard
                    title="Simulated Zone AQI Map"
                    icon={<span role="img" aria-label="zone">🗺️</span>}
                    imageSrc={`${API_BASE_URL}/api/aqi-map/zone-geojson.png${qs}`}
                    imageAlt="Zone AQI Map"
                    interactiveUrl={`${API_BASE_URL}/api/aqi-map/zone-geojson${qs}`}
                    caption="Simulated zone-level aggregated AQI showing regional policy impacts."
                    onRefresh={() => {}}
                    isLoading={false}
                />
                <MapPanelCard
                    title="Simulated AQI Heatmap"
                    icon={<span role="img" aria-label="map">🌡️</span>}
                    imageSrc={`${API_BASE_URL}/api/aqi-map/heatmap.png${qs}`}
                    imageAlt="AQI Heatmap"
                    interactiveUrl={`${API_BASE_URL}/api/aqi-map/heatmap${qs}`}
                    caption="Grid-based AQI intensity map showing broader zones of pollution based on applied policies."
                    onRefresh={() => {}}
                    isLoading={false}
                />
                <MapPanelCard
                    title="Simulated AQI Hotspots"
                    icon={<span role="img" aria-label="target">📍</span>}
                    imageSrc={`${API_BASE_URL}/api/aqi-map/hotspots.png${qs}`}
                    imageAlt="AQI Hotspots"
                    interactiveUrl={`${API_BASE_URL}/api/aqi-map/hotspots${qs}`}
                    caption="Station-level AQI forecast adjusted for policy impacts."
                    onRefresh={() => {}}
                    isLoading={false}
                />
                <MapPanelCard
                    title="Simulated CO2 Heatmap"
                    icon={<span role="img" aria-label="map">☁️</span>}
                    imageSrc={`${API_BASE_URL}/api/emission-map/heatmap.png${qs}`}
                    imageAlt="CO2 Emission Heatmap"
                    interactiveUrl={`${API_BASE_URL}/api/emission-map/heatmap${qs}`}
                    caption="Grid-based CO2 load distribution scaled based on sector policy reductions."
                    onRefresh={() => {}}
                    isLoading={false}
                />
                <MapPanelCard
                    title="Simulated Emission Sources"
                    icon={<span role="img" aria-label="factory">🏭</span>}
                    imageSrc={`${API_BASE_URL}/api/emission-map/hotspots.png${qs}`}
                    imageAlt="CO2 Emission Sources"
                    interactiveUrl={`${API_BASE_URL}/api/emission-map/hotspots${qs}`}
                    caption="Source-level emission markers dynamically reduced for targeted intervention sectors."
                    onRefresh={() => {}}
                    isLoading={false}
                />
            </div>
        </div>
    );
}
