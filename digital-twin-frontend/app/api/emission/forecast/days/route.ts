import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/src/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

interface ForecastRow {
  date: string;
  emission: number;
  sectors: {
    Aviation: number;
    Ground_Transport: number;
    Industry: number;
    Power: number;
    Residential: number;
  };
}

function normalizeDate(input: Date): Date {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(input: Date): string {
  return input.toISOString().split('T')[0];
}

function parseNumber(value?: string): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseForecastCsv(csv: string): ForecastRow[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const indexOf = (name: string) => headers.findIndex((h) => h === name);

  const dateIndex = indexOf('Date');
  const emissionIndex = indexOf('Total_Emission');
  const aviationIndex = indexOf('Aviation');
  const groundTransportIndex = indexOf('Ground_Transport');
  const industryIndex = indexOf('Industry');
  const powerIndex = indexOf('Power');
  const residentialIndex = indexOf('Residential');

  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const date = (cols[dateIndex] || '').trim();
    const emission = parseNumber(cols[emissionIndex]);

    return {
      date,
      emission,
      sectors: {
        Aviation: parseNumber(cols[aviationIndex]),
        Ground_Transport: parseNumber(cols[groundTransportIndex]),
        Industry: parseNumber(cols[industryIndex]),
        Power: parseNumber(cols[powerIndex]),
        Residential: parseNumber(cols[residentialIndex]),
      },
    };
  }).filter((row) => row.date && row.emission > 0);
}

function projectRows(baseRows: ForecastRow[], count: number): ForecastRow[] {
  if (baseRows.length === 0 || count <= 0) {
    return [];
  }

  const window = baseRows.slice(-Math.min(baseRows.length, 7));
  const avgStep = window.length > 1
    ? (window[window.length - 1].emission - window[0].emission) / (window.length - 1)
    : 0;

  const last = baseRows[baseRows.length - 1];
  const lastDate = normalizeDate(new Date(last.date));

  return Array.from({ length: count }).map((_, i) => {
    const emission = Math.max(0, last.emission + avgStep * (i + 1));
    const ratio = last.emission > 0 ? emission / last.emission : 1;
    const date = new Date(lastDate);
    date.setDate(lastDate.getDate() + i + 1);

    return {
      date: formatDate(date),
      emission: Number(emission.toFixed(4)),
      sectors: {
        Aviation: Number((last.sectors.Aviation * ratio).toFixed(4)),
        Ground_Transport: Number((last.sectors.Ground_Transport * ratio).toFixed(4)),
        Industry: Number((last.sectors.Industry * ratio).toFixed(4)),
        Power: Number((last.sectors.Power * ratio).toFixed(4)),
        Residential: Number((last.sectors.Residential * ratio).toFixed(4)),
      },
    };
  });
}

async function buildCsvFallback(days: number) {
  const csvPath = path.join(
    process.cwd(),
    '..',
    'digital-twin-backend',
    'emission_forecast_3years_full.csv'
  );

  const csv = await readFile(csvPath, 'utf-8');
  const rows = parseForecastCsv(csv);
  if (rows.length === 0) {
    throw new Error('Fallback CSV has no usable rows');
  }

  const today = normalizeDate(new Date());
  const historical = rows.filter((r) => normalizeDate(new Date(r.date)) <= today);
  const future = rows.filter((r) => normalizeDate(new Date(r.date)) > today);

  const history = (historical.length > 0 ? historical : rows).slice(-days);
  let forecasts = future.slice(0, days);

  if (forecasts.length < days) {
    const source = forecasts.length > 0 ? forecasts : history;
    const projected = projectRows(source, days - forecasts.length);
    forecasts = [...forecasts, ...projected];
  }

  return {
    status: 'success',
    type: 'daily',
    days,
    history,
    forecasts,
    metrics: {},
    sector_percentages: {},
    source: 'csv_fallback',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const days = Math.max(1, Math.min(365, Number(body?.days ?? 30)));

    try {
      const response = await fetch(`${API_BASE_URL}/api/emission/forecast/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
        cache: 'no-store'
      });

      const data = await response.json().catch(() => ({
        status: 'error',
        message: 'Invalid backend response'
      }));

      if (response.ok && data?.status === 'success') {
        return NextResponse.json(data);
      }
    } catch {
      // Fall through to CSV fallback.
    }

    const fallback = await buildCsvFallback(days);
    return NextResponse.json(fallback);
  } catch (error) {
    console.error('Emission forecast proxy error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unable to fetch emission forecast'
      },
      { status: 502 }
    );
  }
}
