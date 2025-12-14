"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { calculateWrappedStats, WrappedStats } from "@/lib/analytics";

export default function WrappedPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<WrappedStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        async function loadStats() {
            if (!user) return;

            setLoadingStats(true);
            try {
                const wrappedStats = await calculateWrappedStats(user.uid);
                setStats(wrappedStats);
            } catch (error) {
                console.error("Error loading wrapped stats:", error);
            } finally {
                setLoadingStats(false);
            }
        }

        if (user) {
            loadStats();
        }
    }, [user]);

    if (loading || loadingStats || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading your Wrapped...</p>
                </div>
            </div>
        );
    }

    if (!stats || stats.sessionsCompleted === 0) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-6 flex items-center justify-center">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl space-y-4">
                        <div className="text-6xl">📚</div>
                        <h1 className="text-3xl font-bold text-gray-900">No Data Yet</h1>
                        <p className="text-gray-600">Complete some study sessions to see your Wrapped!</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                        >
                            Start Studying
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const slides = [
        // Slide 1: Welcome
        <div key="welcome" className="text-center space-y-6">
            <h1 className="text-6xl font-bold text-white mb-4">Your Study Wrapped</h1>
            <p className="text-2xl text-white/90">Let's see how you did!</p>
            <div className="text-8xl animate-bounce">🎉</div>
        </div>,

        // Slide 2: Total Cards
        <div key="cards" className="text-center space-y-6">
            <p className="text-xl text-white/80">You studied</p>
            <h2 className="text-9xl font-bold text-white">{stats.totalCardsStudied}</h2>
            <p className="text-3xl text-white/90">cards total!</p>
            <div className="text-6xl">🃏</div>
        </div>,

        // Slide 3: Study Time
        <div key="time" className="text-center space-y-6">
            <p className="text-xl text-white/80">That's</p>
            <h2 className="text-9xl font-bold text-white">{stats.totalStudyTime}</h2>
            <p className="text-3xl text-white/90">minutes of studying</p>
            <div className="text-6xl">⏱️</div>
        </div>,

        // Slide 4: Sessions
        <div key="sessions" className="text-center space-y-6">
            <p className="text-xl text-white/80">Across</p>
            <h2 className="text-9xl font-bold text-white">{stats.sessionsCompleted}</h2>
            <p className="text-3xl text-white/90">study sessions</p>
            <div className="text-6xl">📖</div>
        </div>,

        // Slide 5: Streak
        <div key="streak" className="text-center space-y-6">
            <p className="text-xl text-white/80">Your current streak</p>
            <h2 className="text-9xl font-bold text-white">{stats.currentStreak}</h2>
            <p className="text-3xl text-white/90">days in a row!</p>
            <div className="text-6xl">{stats.currentStreak > 0 ? "🔥" : "💪"}</div>
        </div>,

        // Slide 6: Accuracy
        <div key="accuracy" className="text-center space-y-6">
            <p className="text-xl text-white/80">Overall accuracy</p>
            <h2 className="text-9xl font-bold text-white">{stats.averageAccuracy}%</h2>
            <p className="text-3xl text-white/90">correct responses</p>
            <div className="text-6xl">🎯</div>
        </div>,

        // Slide 7: Active Days
        <div key="days" className="text-center space-y-6">
            <p className="text-xl text-white/80">You were active for</p>
            <h2 className="text-9xl font-bold text-white">{stats.totalDaysActive}</h2>
            <p className="text-3xl text-white/90">different days</p>
            <div className="text-6xl">📅</div>
        </div>,

        // Slide 8: Finale
        <div key="finale" className="text-center space-y-6">
            <h2 className="text-5xl font-bold text-white mb-8">Keep it up!</h2>
            <p className="text-2xl text-white/90">You're doing great 🌟</p>
            <button
                onClick={() => router.push("/dashboard")}
                className="mt-8 px-8 py-4 bg-white text-purple-600 rounded-lg font-bold text-xl hover:bg-gray-100 transition"
            >
                Back to Dashboard
            </button>
        </div>,
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-6">
            <div className="max-w-4xl mx-auto h-screen flex flex-col justify-center items-center">
                {/* Slide Content */}
                <div className="w-full max-w-2xl">
                    {slides[currentSlide]}
                </div>

                {/* Navigation */}
                <div className="mt-12 flex items-center gap-4">
                    <button
                        onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                        disabled={currentSlide === 0}
                        className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        Previous
                    </button>

                    {/* Dots */}
                    <div className="flex gap-2">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`w-3 h-3 rounded-full transition ${i === currentSlide ? "bg-white" : "bg-white/30"
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                        disabled={currentSlide === slides.length - 1}
                        className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        Next
                    </button>
                </div>

                {/* Progress */}
                <div className="mt-4 text-white/60 text-sm">
                    {currentSlide + 1} / {slides.length}
                </div>
            </div>
        </main>
    );
}
