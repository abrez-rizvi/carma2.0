import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { MapPanelCard } from './MapPanel';

export function AQIMaps() {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<'ward' | 'zone'>('zone');
    const [isLoading, setIsLoading] = useState(false);

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        setIsLoading(true);
    };

    const heatmapCaption = selectedLevel === 'zone' 
        ? 'Aggregated MCD Zone analysis.'
        : 'Clipped grid analysis via Folium & Geomapping.';
        
    const hotspotsCaption = selectedYear
        ? `Projected AQI based on ${selectedYear} emission forecasts.`
        : 'Live sensor readings from 40+ stations.';

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <div className="flex bg-white/5 rounded-full p-1 border border-white/10 inline-flex">
                    <button 
                        onClick={() => setSelectedLevel('zone')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${selectedLevel === 'zone' ? 'bg-purple-500/20 text-purple-300' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        Zone View
                    </button>
                    <button 
                        onClick={() => setSelectedLevel('ward')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${selectedLevel === 'ward' ? 'bg-purple-500/20 text-purple-300' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        Ward View
                    </button>
                </div>
            </div>
            
            <div className='flex gap-4'>
                <MapPanelCard
                    title={`Delhi AQI Heatmap (${selectedLevel === 'zone' ? 'Zones' : 'Wards'})`}
                    icon={<span role="img" aria-label="map">🗺️</span>}
                    imageSrc={`${API_BASE_URL}/api/aqi-map/heatmap.png?level=${selectedLevel}`}
                    imageAlt="AQI Heatmap"
                    interactiveUrl={`${API_BASE_URL}/api/aqi-map/heatmap?level=${selectedLevel}`}
                    caption={heatmapCaption}
                    onRefresh={() => { }}
                    isLoading={false}
                />
                <MapPanelCard
                    title="AQI Hotspots"
                    icon={<span role="img" aria-label="target">📍</span>}
                    imageSrc={
                        selectedYear
                            ? `${API_BASE_URL}/api/aqi-map/hotspots.png?year=${selectedYear}&level=${selectedLevel}`
                            : `${API_BASE_URL}/api/aqi-map/hotspots.png?level=${selectedLevel}`
                    }
                    imageAlt="AQI Hotspots"
                    interactiveUrl={
                        selectedYear
                            ? `${API_BASE_URL}/api/aqi-map/hotspots?year=${selectedYear}&level=${selectedLevel}`
                            : `${API_BASE_URL}/api/aqi-map/hotspots?level=${selectedLevel}`
                    }
                    caption={hotspotsCaption}
                    yearSelector={{
                        selectedYear,
                        years: ['2026', '2027', '2028'],
                        onChange: handleYearChange,
                    }}
                    forecastBadge={selectedYear ? {
                        label: `${selectedYear} Forecast`,
                        colorClass: 'bg-purple-500/30 text-purple-300 border-purple-500/50',
                    } : undefined}
                    onRefresh={() => handleYearChange(selectedYear)}
                    isLoading={isLoading}
                    loadingText="Generating forecast..."
                    onLoadComplete={() => setIsLoading(false)}
                />
            </div>
        </div>
    );
}
