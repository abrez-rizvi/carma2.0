"use client";

import React, { ReactNode } from 'react';
import { AQIProvider } from './AQIContext';
import { SimulationProvider } from './SimulationContext';

// Re-export everything for backward compatibility
export { useAQI } from './AQIContext';
export { useSimulation } from './SimulationContext';
export type { AQIData } from '../types';
export type { HealthImpactData } from './AQIContext';
export type { PolicySliderValue, ScenarioResult } from './SimulationContext';

/**
 * Combined provider that wraps both AQI and Simulation contexts.
 * Components only re-render when their specific context changes.
 */
export function GlobalProvider({ children }: { children: ReactNode }) {
    return (
        <AQIProvider>
            <SimulationProvider>
                {children}
            </SimulationProvider>
        </AQIProvider>
    );
}
