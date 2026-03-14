import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

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

function parseForecastCsv(csv: string): ForecastRow[] {
  const lines = csv.trim().split(/\r?\n/);
  const [, ...rows] = lines;

  return rows.map((line) => {
    const [
      date,
      totalEmission,
      aviation,
      groundTransport,
      industry,
      power,
      residential,
    ] = line.split(",");

    return {
      date,
      emission: Number(totalEmission),
      sectors: {
        Aviation: Number(aviation),
        Ground_Transport: Number(groundTransport),
        Industry: Number(industry),
        Power: Number(power),
        Residential: Number(residential),
      },
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const requestedYear = Number(request.nextUrl.searchParams.get("year") ?? 2028);
    const availableYears = [2026, 2027, 2028];
    const year = availableYears.includes(requestedYear)
      ? requestedYear
      : requestedYear < 2026
        ? 2026
        : 2028;

    const csvPath = path.join(
      process.cwd(),
      "..",
      "digital-twin-backend",
      "emission_forecast_3years_full.csv"
    );
    const csv = await readFile(csvPath, "utf-8");
    const rows = parseForecastCsv(csv).filter((row) => {
      return new Date(row.date).getFullYear() === year;
    });

    return NextResponse.json({
      status: "success",
      requestedYear,
      year,
      rows,
      usedNearestYear: requestedYear !== year,
    });
  } catch (error) {
    console.error("Year forecast route error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Unable to load yearly emission forecast data",
      },
      { status: 500 }
    );
  }
}
