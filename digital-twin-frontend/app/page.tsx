import { SectorInterdependence } from "../src/components/SectorInterdependence";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, FlaskConical, Map, History } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Welcome Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-center mb-6">
            <Image
              src="/carma-logo.png"
              alt="CARMA Logo"
              width={180}
              height={180}
              className="drop-shadow-2xl"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6 drop-shadow-md">
            Welcome to CARMA
          </h1>
          <p className="text-xl text-white/50 mb-12">
            The Urban CO₂ Digital Twin. Explore baselines, analyze historic trends,
            view dynamic emission maps, and simulate policy lab impacts all in one unified platform.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/baseline" className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
              <BarChart3 className="w-8 h-8 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-white mb-2">Baseline</h3>
              <p className="text-xs text-white/40 mb-4">Current environmental & economic states</p>
              <div className="text-emerald-400 text-xs flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Enter <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            <Link href="/historic-trends" className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
              <History className="w-8 h-8 text-amber-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-white mb-2">Historic Trends</h3>
              <p className="text-xs text-white/40 mb-4">Past emissions & AQI analysis</p>
              <div className="text-emerald-400 text-xs flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Enter <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            <Link href="/policy-simulator" className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
              <FlaskConical className="w-8 h-8 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-white mb-2">Policy Simulator</h3>
              <p className="text-xs text-white/40 mb-4">Experiment, generate & evaluate policies</p>
              <div className="text-emerald-400 text-xs flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Enter <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Sector Interdependence Map */}
      <SectorInterdependence />
    </div>
  );
}
