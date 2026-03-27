import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { MapPanelCard } from './MapPanel';

export function EmissionMaps() {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<'ward' | 'zone'>('zone');
    const [isLoading, setIsLoading] = useState(false);

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        setIsLoading(true);
    };

    const heatmapCaption = selectedLevel === 'zone' 
        ? 'Aggregated CO₂ concentration analysis across MCD Zones.'
        : 'Detailed ward-level CO₂ concentration analysis across Delhi.';
        
    const hotspotsCaption = selectedYear
        ? `Projected CO₂ sources based on ${selectedYear} emission forecasts.`
        : 'Sector-wise emission sources: Industry, Transport, Power, Residential.';

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
                    title={`CO₂ Emission Heatmap (${selectedLevel === 'zone' ? 'Zones' : 'Wards'})`}
                    icon={<span role="img" aria-label="map">🌡️</span>}
                    imageSrc={`${API_BASE_URL}/api/emission-map/heatmap.png?level=${selectedLevel}`}
                    imageAlt="CO2 Emission Heatmap"
                    interactiveUrl={`${API_BASE_URL}/api/emission-map/heatmap?level=${selectedLevel}`}
                    caption={heatmapCaption}
                    onRefresh={() => { }}
                    isLoading={false}
                />
                <MapPanelCard
                    title="Emission Sources"
                    icon={<span role="img" aria-label="factory">🏭</span>}
                    imageSrc={
                        selectedYear
                            ? `${API_BASE_URL}/api/emission-map/hotspots.png?year=${selectedYear}&level=${selectedLevel}`
                            : `${API_BASE_URL}/api/emission-map/hotspots.png?level=${selectedLevel}`
                    }
                    imageAlt="CO2 Emission Sources"
                    interactiveUrl={
                        selectedYear
                            ? `${API_BASE_URL}/api/emission-map/hotspots?year=${selectedYear}&level=${selectedLevel}`
                            : `${API_BASE_URL}/api/emission-map/hotspots?level=${selectedLevel}`
                    }
                    caption={hotspotsCaption}
                    yearSelector={{
                        selectedYear,
                        years: ['2026', '2027', '2028'],
                        onChange: handleYearChange,
                    }}
                    forecastBadge={selectedYear ? {
                        label: `${selectedYear} Forecast`,
                        colorClass: 'bg-blue-500/30 text-blue-300 border-blue-500/50',
                    } : undefined}
                    onRefresh={() => handleYearChange(selectedYear)}
                    isLoading={isLoading}
                    loadingText="Generating forecast..."
                    onLoadComplete={() => setIsLoading(false)}
                />

                {/* Legend */}
                <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-xs z-50 hidden lg:block">
                    <div className="font-bold text-white mb-2">Emission Sources</div>
                    <div className="space-y-1 text-white/70">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span> Industry
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500"></span> Aviation
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Transport
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-500"></span> Power
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span> Residential
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Commercial
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
