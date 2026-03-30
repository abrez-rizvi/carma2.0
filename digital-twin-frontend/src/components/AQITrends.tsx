"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Wind } from 'lucide-react';
import { ChartPanel, chartTooltipStyle } from './ChartPanel';

interface AQITrendPoint {
    date: string;
    aqi_hist?: number | null;
    aqi_forecast?: number | null;
}

let cachedAqiTrendsData: AQITrendPoint[] | null = null;

export function AQITrends() {
    const [data, setData] = useState<AQITrendPoint[]>(cachedAqiTrendsData || []);
    const [loading, setLoading] = useState(!cachedAqiTrendsData);

    useEffect(() => {
        if (!cachedAqiTrendsData) {
            loadData();
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [histRes, fcRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/aqi/history`),
                fetch(`${API_BASE_URL}/api/aqi/forecast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ days: 180 })
                })
            ]);

            const histData = await histRes.json();
            const fcData = await fcRes.json();

            if (histData.status === 'success') {
                const fullHistory = histData.data.map((d: any) => ({
                    date: d.date,
                    aqi_hist: d.aqi,
                    aqi_forecast: null
                }));

                const history = fullHistory.slice(-60);
                let combined = [...history];

                if (fcData.status === 'success' && fcData.data.forecast) {
                    const forecast = fcData.data.forecast.map((d: any) => ({
                        date: d.date,
                        aqi_hist: null,
                        aqi_forecast: d.aqi
                    }));

                    if (history.length > 0) {
                        const last = history[history.length - 1];
                        forecast.unshift({
                            date: last.date,
                            aqi_hist: null,
                            aqi_forecast: last.aqi_hist
                        });
                    }

                    combined = [...history, ...forecast];
                }

                cachedAqiTrendsData = combined;
                setData(combined);
            }
        } catch (e) {
            console.error("AQI Data error:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ChartPanel
            title="AQI Trends & AI Forecast"
            icon={<Wind className="w-5 h-5 text-secondary" />}
            loading={loading}
            loadingText="Computing AI Forecast..."
            className="h-full"
            footer={
                <div className="mt-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                            What This Shows
                        </div>
                        <p className="text-sm text-white/65 leading-relaxed">
                            The blue line tracks recent observed AQI levels, while the green dashed line extends
                            that pattern into the forecast period using the model&apos;s prediction window.
                        </p>
                        <p className="text-xs text-white/45 leading-relaxed mt-2">
                            Spikes usually reflect episodic pollution events, weather trapping, or seasonal combustion.
                            Sustained drops indicate cleaner background conditions rather than one-off relief.
                        </p>
                    </div>
                    <p className="text-xs text-white/40 text-center font-mono">
                        Analysis based on historical sensor data + predictive AI modeling.
                    </p>
                </div>
            }
        >
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickFormatter={(str) => {
                                const date = new Date(str);
                                return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
                            }}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <Tooltip
                            contentStyle={chartTooltipStyle}
                            itemStyle={{ color: '#fff' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="aqi_hist"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 0 }}
                            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                            name="Historical AQI"
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="aqi_forecast"
                            stroke="#4ade80"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{ r: 0 }}
                            activeDot={{ r: 6, fill: '#4ade80', stroke: '#fff', strokeWidth: 2 }}
                            name="Predicted AQI"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </ChartPanel>
    );
}
