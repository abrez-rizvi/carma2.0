import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { MapPanelCard } from './MapPanel';

export function AQIMaps() {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        setIsLoading(true);
    };

    const heatmapCaption = 'Grid-based AQI intensity map across Delhi. Darker red cells indicate broader zones of persistently poor air quality, making it useful for spotting spatial concentration rather than single-station spikes.';
    const hotspotsCaption = selectedYear
        ? `Station-level AQI hotspot forecast for ${selectedYear}. Larger and redder markers indicate more severe expected pollution at specific monitoring points.`
        : 'Live station-level AQI readings from 40+ sensors. Marker color and value show where pollution is currently most concentrated.';

    return (
        <div className='flex gap-4'>
            <MapPanelCard
                title="Delhi AQI Heatmap"
                icon={<span role="img" aria-label="map">🗺️</span>}
                imageSrc={`${API_BASE_URL}/api/aqi-map/heatmap.png`}
                imageAlt="AQI Heatmap"
                interactiveUrl={`${API_BASE_URL}/api/aqi-map/heatmap`}
                caption={heatmapCaption}
                onRefresh={() => {}}
                isLoading={false}
            />
            <MapPanelCard
                title="AQI Hotspots"
                icon={<span role="img" aria-label="target">📍</span>}
                imageSrc={
                    selectedYear
                        ? `${API_BASE_URL}/api/aqi-map/hotspots.png?year=${selectedYear}`
                        : `${API_BASE_URL}/api/aqi-map/hotspots.png`
                }
                imageAlt="AQI Hotspots"
                interactiveUrl={
                    selectedYear
                        ? `${API_BASE_URL}/api/aqi-map/hotspots?year=${selectedYear}`
                        : `${API_BASE_URL}/api/aqi-map/hotspots`
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
            />
        </div>
    );
}
