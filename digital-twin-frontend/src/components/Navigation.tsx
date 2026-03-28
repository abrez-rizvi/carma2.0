"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  FlaskConical,
  BarChart,
  GitCompare,
  Map,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

import { History } from "lucide-react";

const NAV_SECTIONS = [
  { id: "baseline", href: "/baseline", label: "Baseline", icon: BarChart3 },
  { id: "historic-trends", href: "/historic-trends", label: "Historic Trends", icon: History },
  { id: "policy-simulator", href: "/policy-simulator", label: "Policy Simulator", icon: FlaskConical },
];

// Removed scrollToSection as we are using distinct pages now

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/carma-logo.png"
                alt="CARMA Logo"
                width={50}
                height={50}
                className="drop-shadow-2xl"
              />
            <div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                CARMA
              </span>
              <span className="block text-[10px] text-white/30 -mt-0.5 tracking-wide">
                Urban CO₂ digital twin
              </span>
            </div>
          </Link>

          {/* Desktop Section Anchors */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = pathname === section.href;
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors group ${isActive
                      ? "bg-white/10 text-emerald-400"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : "text-white/40 group-hover:text-emerald-400"}`} />
                  {section.label}
                </Link>
              );
            })}
          </div>

          {/* Page Links (secondary) */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <Link
              href="/hyper-aqi"
              className="text-white/30 hover:text-white/60 transition-colors px-2 py-1"
            >
              Hyper Local AQI
            </Link>
            <Link
              href="/solutions"
              className="text-white/30 hover:text-white/60 transition-colors px-2 py-1"
            >
              Solutions
            </Link>
            <Link
              href="/health-impact"
              className="text-white/30 hover:text-white/60 transition-colors px-2 py-1"
            >
              Health Impact
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white/60 p-2"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              {NAV_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = pathname === section.href;
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all ${isActive
                        ? "bg-white/10 text-emerald-400"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </Link>
                );
              })}
              <div className="border-t border-white/5 pt-2 mt-2">
                <Link
                  href="/hyper-aqi"
                  className="block px-4 py-3 text-sm text-white/40 hover:text-white/60"
                >
                  Hyper Local AQI
                </Link>
                <Link
                  href="/solutions"
                  className="block px-4 py-3 text-sm text-white/40 hover:text-white/60"
                >
                  Solutions Lab
                </Link>
                <Link
                  href="/health-impact"
                  className="block px-4 py-3 text-sm text-white/40 hover:text-white/60"
                >
                  Health Impact
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
