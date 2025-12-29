import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

interface QuizIdentityLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export function QuizIdentityLayout({ children, title, subtitle }: QuizIdentityLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1810] via-[#122618] to-[#0d1d14] relative overflow-hidden">
            {/* Large Cleaner Image - positioned absolute on the right */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden xl:block pointer-events-none">
                <img
                    src="/bookquiz.png"
                    alt=""
                    className="absolute right-0 bottom-0 h-[90vh] w-auto object-contain"
                    style={{ maxWidth: 'none' }}
                />
                {/* Gradient fade to blend with background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a1810] via-[#0a1810]/80 to-transparent" />
            </div>

            {/* Floating orbs for ambiance */}
            <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-emerald-400/5 rounded-full blur-[120px]" />

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
                >
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Home className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">Back to Home</span>
                </Link>

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-emerald-500/30">
                        <img src="/imported/images/logo.png" alt="" className="h-6 w-auto invert brightness-0" />
                    </div>
                    <span className="text-lg font-bold text-white hidden sm:block">Verde Luxe</span>
                </div>
            </header>

            {/* Main Content - Centered */}
            <main className="relative z-20 flex items-center justify-center min-h-[calc(100vh-200px)] px-6 md:px-12">
                <div className="w-full max-w-lg">
                    {/* Title */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Premium Cleaning</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">{title}</h1>
                        {subtitle && (
                            <p className="text-lg text-white/50 leading-relaxed max-w-md mx-auto">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Content Card */}
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                        <div className="space-y-5">
                            {children}
                        </div>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/30">
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="text-lg">✨</span> Premium Service
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="text-lg">🛡️</span> Insured & Bonded
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="text-lg">⭐</span> 5-Star Rated
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-20 text-center py-6">
                <p className="text-xs text-white/30">
                    Verde Luxe Premium Cleaning • Secure Session
                </p>
            </footer>
        </div>
    );
}
