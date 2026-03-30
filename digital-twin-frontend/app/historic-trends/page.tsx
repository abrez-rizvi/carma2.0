import { HistoricEmissions } from "../../src/components/HistoricEmissions";
import { AQITrends } from "../../src/components/AQITrends";
import { AQIMaps } from "../../src/components/AQIMaps";
import { EmissionMaps } from "../../src/components/EmissionMaps";
import { SectorMaps } from "../../src/components/SectorMaps";

export default function HistoricTrendsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
            <span className="text-lg">📈</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Historic Trends & Maps
            </h2>
            <p className="text-sm text-white/40">
              Historical overview of emissions, spatial AQI heatmaps, and source visualizations
            </p>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-6">
            <AQITrends />
            <HistoricEmissions />
          </div>

          <div className="my-12 border-t border-white/5 pt-12">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                  <span className="text-lg">🗺️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Interactive Maps</h2>
                  <p className="text-sm text-white/40">
                    AQI heatmaps, emission sources, and sector-specific visualizations
                  </p>
                </div>
            </div>

            <div className="space-y-8">
              <AQIMaps />
              <EmissionMaps />
              <div className="glass-panel p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🗺️</span>
                  <h3 className="text-lg font-bold text-white">
                    Sector-Specific Carbon Emissions
                  </h3>
                </div>
                <SectorMaps />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
