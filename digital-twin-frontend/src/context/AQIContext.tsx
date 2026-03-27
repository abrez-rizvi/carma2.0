"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config';
import type { AQIData } from '../types';
export type { AQIData };

export interface HealthImpactData {
    aqi_level: number;
    category: string;
    risk_summary: string;
    age_specific_impacts: {
        newborns: string;
        children: string;
        teenagers_young_adults: string;
        adults_36_65: string;
        elderly: string;
    };
    pregnancy_risks: string;
    pre_existing_conditions: {
        asthma: string;
        diabetes: string;
        cardiovascular: string;
    };
    immediate_actions: string[];
    long_term_risk: {
        life_expectancy_loss: string;
        chronic_conditions: string;
    };
    safeguard_protocols: string[];
    urgency_level: "Low" | "Medium" | "High" | "Critical";
}

interface AQIContextType {
    aqiData: AQIData | null;
    isLoading: boolean;
    isLiveData: boolean;
    refreshAQI: () => Promise<void>;
    healthAnalysis: HealthImpactData | null;
    isAnalyzing: boolean;
    generateHealthAnalysis: (overrideData?: AQIData) => Promise<void>;
    selectedZone: string | null;
    setSelectedZone: (zone: string | null) => void;
    selectedWard: string | null;
    setSelectedWard: (ward: string | null) => void;
}

const AQIContext = createContext<AQIContextType | undefined>(undefined);

export function AQIProvider({ children }: { children: ReactNode }) {
    const [aqiData, setAqiData] = useState<AQIData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiveData, setIsLiveData] = useState(false);
    const [healthAnalysis, setHealthAnalysis] = useState<HealthImpactData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedWard, setSelectedWard] = useState<string | null>(null);

    const fetchAQI = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/aqi?lat=28.7041&lon=77.1025`);
            if (!response.ok) {
                console.error(`API error: ${response.status}.`);
                setIsLiveData(false);
                return;
            }
            const data = await response.json();
            setIsLiveData(data.source !== 'Mock Data');
            setAqiData(data);
        } catch (error) {
            console.error('Failed to fetch AQI data:', error);
            setIsLiveData(false);
        } finally {
            setIsLoading(false);
        }
    };

    const generateHealthAnalysis = async (overrideData?: AQIData) => {
        const dataToAnalyze = overrideData || aqiData;
        if (!dataToAnalyze) return;
        setIsAnalyzing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/analyze-aqi-health`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ aqi_data: dataToAnalyze }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch health analysis');
            }

            const data = await response.json();
            if (data.health_impact) {
                setHealthAnalysis(data.health_impact);
            }
        } catch (err) {
            console.error("Error fetching health impact:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchAQI();
        const interval = setInterval(fetchAQI, 600000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AQIContext.Provider value={{
            aqiData,
            isLoading,
            isLiveData,
            refreshAQI: fetchAQI,
            healthAnalysis,
            isAnalyzing,
            generateHealthAnalysis,
            selectedZone,
            setSelectedZone,
            selectedWard,
            setSelectedWard,
        }}>
            {children}
        </AQIContext.Provider>
    );
}

export function useAQI() {
    const context = useContext(AQIContext);
    if (context === undefined) {
        throw new Error('useAQI must be used within an AQIProvider');
    }
    return context;
}
