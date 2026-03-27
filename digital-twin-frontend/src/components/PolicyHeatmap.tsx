"use client";

import { useSimulation } from "../context/SimulationContext";
import { Reveal } from "./Reveal";
import { Grid3X3, MapPin, ChevronLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { delhiWards } from "../data/delhiWards";

const METRICS = [
  { id: "emissions", label: "Emissions Reduction" },
  { id: "aqi", label: "AQI Contribution" },
  { id: "economic", label: "Economic Output" },
  { id: "health", label: "Health Impact" },
];

/** Get color based on value (-100 to 100 scale) */
function getHeatColor(value: number): string {
  if (value > 0) {
    // Green scale for improvement
    const intensity = Math.min(value / 50, 1);
    return `rgba(16, 185, 129, ${0.1 + intensity * 0.6})`;
  } else if (value < 0) {
    // Red scale for deterioration
    const intensity = Math.min(Math.abs(value) / 50, 1);
    return `rgba(239, 68, 68, ${0.1 + intensity * 0.6})`;
  }
  return "rgba(255, 255, 255, 0.03)";
}

function getTextColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-white/30";
}

/** Generate consistent regional values based on the base simulation output */
function generateRegionalData(
  sectorEmissions: Record<string, number>,
  regionId: string
): Record<string, number> {
  const baseAvg = Object.values(sectorEmissions).length > 0
    ? Object.values(sectorEmissions).reduce((a,b) => a+b, 0) / Object.values(sectorEmissions).length
    : 0;

  // Pseudo-random variance based on region name (-15% to +15%)
  let sum = 0;
  for (let i = 0; i < regionId.length; i++) sum += regionId.charCodeAt(i);
  const variance = ((sum % 30) - 15) / 100;

  const val = baseAvg * (1 + variance);

  return {
    emissions: val,
    aqi: val * 0.65,
    economic: val > 20 ? -(val * 0.15) : val * 0.1,
    health: val * 0.8,
  };
}

export function PolicyHeatmap() {
  const { latestResult } = useSimulation();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const zones = useMemo(() => Array.from(new Set(delhiWards.map(w => w.zone))).sort(), []);
  const wards = useMemo(() => selectedZone ? delhiWards.filter(w => w.zone === selectedZone).sort((a,b) => a.name.localeCompare(b.name)) : [], [selectedZone]);
  
  const displayRows = selectedZone 
    ? wards.map(w => ({ id: w.id.toString(), label: w.name })) 
    : zones.map(z => ({ id: z, label: z }));

  return (
    <section id="heatmap" className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-white/10 shrink-0">
                <Grid3X3 className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Regional Impact Heatmap
                </h2>
                <p className="text-sm text-white/40">
                  {selectedZone ? `Ward-level analysis for ${selectedZone}` : "Zone-wise policy impact distribution"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:ml-auto">
                {selectedZone && (
                  <button 
                    onClick={() => setSelectedZone(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" /> Back to Zones
                  </button>
                )}
                {/* Legend */}
                <div className="hidden sm:flex items-center gap-4 text-xs text-white/40 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgb(16, 185, 129)" }} />
                    <span>Improvement</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <span>Neutral</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgb(239, 68, 68)" }} />
                    <span>Deterioration</span>
                  </div>
                </div>
            </div>
          </div>
        </Reveal>

        {!latestResult ? (
          <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
            <div className="text-center">
              <Grid3X3 className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">
                Run a simulation to see the regional impact heatmap
              </p>
            </div>
          </div>
        ) : (
          <Reveal delay={100}>
            <div className="glass-panel p-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-white/50 uppercase tracking-widest w-48">
                      {selectedZone ? "Ward" : "Zone"}
                    </th>
                    {METRICS.map((m) => (
                      <th
                        key={m.id}
                        className="text-center py-3 px-4 text-xs font-bold text-white/50 uppercase tracking-widest"
                      >
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
                    const regionalData = generateRegionalData(latestResult.metrics.sectorEmissions, row.id);
                    return (
                      <tr 
                        key={row.id} 
                        className={`border-t border-white/5 transition-colors ${!selectedZone ? 'hover:bg-white/5 cursor-pointer group' : ''}`}
                        onClick={() => !selectedZone && setSelectedZone(row.label)}
                      >
                        <td className="py-4 px-4 text-sm font-medium text-white/80 flex items-center gap-2">
                          {!selectedZone && <MapPin className="w-3.5 h-3.5 text-white/30 group-hover:text-emerald-400 transition-colors" />}
                          {row.label}
                        </td>
                        {METRICS.map((metric) => {
                          const val = regionalData[metric.id] || 0;
                          return (
                            <td key={metric.id} className="py-4 px-4">
                              <div
                                className="rounded-xl p-3 text-center transition-all duration-300 hover:scale-110 shadow-lg"
                                style={{ backgroundColor: getHeatColor(val) }}
                              >
                                <div
                                  className={`text-sm md:text-base font-bold font-mono ${getTextColor(val)}`}
                                >
                                  {val > 0 ? "+" : ""}
                                  {val.toFixed(1)}%
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
