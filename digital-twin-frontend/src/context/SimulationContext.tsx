"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PolicySliderValue {
    id: string;
    label: string;
    value: number;
    sector: string;
    weight: number;
}

export interface ScenarioResult {
    id: string;
    name: string;
    policyConfig: Record<string, number>;
    metrics: {
        co2Reduction: number;
        aqiImprovement: number;
        gdpChange: number;
        healthBenefit: number;
        sectorEmissions: Record<string, number>;
    };
    timestamp: number;
}

interface SimulationContextType {
    selectedCity: string;
    setSelectedCity: (city: string) => void;
    timeHorizon: [number, number];
    setTimeHorizon: (range: [number, number]) => void;
    activeSectors: string[];
    setActiveSectors: (sectors: string[]) => void;
    toggleSector: (sector: string) => void;
    policyValues: Record<string, number>;
    setPolicyValues: (values: Record<string, number>) => void;
    updatePolicyValue: (id: string, value: number) => void;
    isSimulating: boolean;
    setIsSimulating: (v: boolean) => void;
    simulationResults: ScenarioResult[];
    addScenario: (scenario: ScenarioResult) => void;
    clearScenarios: () => void;
    latestResult: ScenarioResult | null;
    setLatestResult: (result: ScenarioResult | null) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const ALL_SECTORS = ['Ground_Transport', 'Industry', 'Power', 'Residential', 'Aviation'];

export function SimulationProvider({ children }: { children: ReactNode }) {
    const [selectedCity, setSelectedCity] = useState('Delhi');
    const [timeHorizon, setTimeHorizon] = useState<[number, number]>([2025, 2030]);
    const [activeSectors, setActiveSectors] = useState<string[]>(ALL_SECTORS);
    const [policyValues, setPolicyValues] = useState<Record<string, number>>({});
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResults, setSimulationResults] = useState<ScenarioResult[]>([]);
    const [latestResult, setLatestResult] = useState<ScenarioResult | null>(null);

    const toggleSector = (sector: string) => {
        setActiveSectors(prev =>
            prev.includes(sector)
                ? prev.filter(s => s !== sector)
                : [...prev, sector]
        );
    };

    const updatePolicyValue = (id: string, value: number) => {
        setPolicyValues(prev => ({ ...prev, [id]: value }));
    };

    const addScenario = (scenario: ScenarioResult) => {
        setSimulationResults(prev => [...prev.slice(-2), scenario]);
    };

    const clearScenarios = () => {
        setSimulationResults([]);
    };

    return (
        <SimulationContext.Provider value={{
            selectedCity,
            setSelectedCity,
            timeHorizon,
            setTimeHorizon,
            activeSectors,
            setActiveSectors,
            toggleSector,
            policyValues,
            setPolicyValues,
            updatePolicyValue,
            isSimulating,
            setIsSimulating,
            simulationResults,
            addScenario,
            clearScenarios,
            latestResult,
            setLatestResult,
        }}>
            {children}
        </SimulationContext.Provider>
    );
}

export function useSimulation() {
    const context = useContext(SimulationContext);
    if (context === undefined) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
}
