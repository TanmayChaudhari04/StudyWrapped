"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { StudySession, SessionStats } from "@/components/study-session";
import { calculateNextReview, isCardDue, Rating, CardProgress } from "@/lib/sm2";
import { saveStudySession } from "@/lib/analytics";
import { doc, getDoc, collection, getDocs, setDoc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DeckData {
    id: string;
    cards: Array<{ question: string; answer: string; topic: string }>;
    topics?: string[];
    cardCount: number;
    userId: string;
    createdAt: any;
}

export default function StudyPage({ params }: { params: Promise<{ deckId: string }> }) {
    // Unwrap params Promise
    const { deckId } = use(params);

    const { user, loading } = useAuth();
    const router = useRouter();
    const [deck, setDeck] = useState<DeckData | null>(null);
    const [dueCards, setDueCards] = useState<any[]>([]);
    const [cardProgress, setCardProgress] = useState<Map<number, CardProgress>>(new Map());
    const [loadingDeck, setLoadingDeck] = useState(true);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Load deck and card progress
    useEffect(() => {
        async function loadDeckAndProgress() {
            if (!user) return;

            try {
                // Load deck
                const deckDoc = await getDoc(doc(db, "decks", deckId));
                if (!deckDoc.exists()) {
                    alert("Deck not found");
                    router.push("/dashboard");
                    return;
                }

                const deckData = { id: deckDoc.id, ...deckDoc.data() } as DeckData;
                setDeck(deckData);

                // Load card progress
                const progressMap = new Map<number, CardProgress>();
                const progressQuery = query(collection(db, `decks/${deckId}/cardProgress`));
                const progressSnapshot = await getDocs(progressQuery);

                progressSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const cardIndex = parseInt(doc.id);
                    progressMap.set(cardIndex, {
                        ...data,
                        nextReviewDate: data.nextReviewDate.toDate(),
                        lastReviewedAt: data.lastReviewedAt.toDate(),
                    } as CardProgress);
                });

                setCardProgress(progressMap);

                // Filter due cards
                const due = deckData.cards.filter((_: any, index: number) => {
                    const progress = progressMap.get(index);
                    return isCardDue(progress || null);
                });

                setDueCards(due);
            } catch (error) {
                console.error("Error loading deck:", error);
                alert("Failed to load deck");
                router.push("/dashboard");
            } finally {
                setLoadingDeck(false);
            }
        }

        if (user && deckId) {
            loadDeckAndProgress();
        }
    }, [user, deckId, router]);

    const handleCardRated = async (cardIndex: number, rating: Rating) => {
        const currentProgress = cardProgress.get(cardIndex) || null;
        const newProgress = calculateNextReview(currentProgress, rating);

        try {
            // Save to Firebase
            await setDoc(doc(db, `decks/${deckId}/cardProgress`, cardIndex.toString()), {
                easinessFactor: newProgress.easinessFactor,
                interval: newProgress.interval,
                repetitions: newProgress.repetitions,
                nextReviewDate: newProgress.nextReviewDate,
                lastReviewedAt: newProgress.lastReviewedAt,
            });

            // Update local state
            const newCardProgress = new Map(cardProgress);
            newCardProgress.set(cardIndex, newProgress);
            setCardProgress(newCardProgress);
        } catch (error) {
            console.error("Error saving card progress:", error);
        }
    };

    const handleSessionComplete = async (stats: SessionStats) => {
        setSessionStats(stats);
        setSessionComplete(true);

        // Save session analytics
        if (user && deck) {
            try {
                await saveStudySession({
                    userId: user.uid,
                    deckId: deck.id,
                    startedAt: sessionStartTime,
                    completedAt: new Date(),
                    cardsStudied: stats.totalCards,
                    ratings: {
                        again: stats.againCount,
                        hard: stats.hardCount,
                        good: stats.goodCount,
                        easy: stats.easyCount,
                    },
                });
            } catch (error) {
                console.error("Failed to save session analytics:", error);
            }
        }
    };

    if (loading || loadingDeck || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading study session...</p>
                </div>
            </div>
        );
    }

    if (sessionComplete && sessionStats) {
        return (
            <main className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center space-y-6">
                        <div className="text-6xl">🎉</div>
                        <h1 className="text-3xl font-bold text-gray-900">Session Complete!</h1>
                        <p className="text-gray-600">Great work! You reviewed {sessionStats.totalCards} cards.</p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
                            <div className="bg-red-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{sessionStats.againCount}</div>
                                <div className="text-sm text-gray-600">Again</div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">{sessionStats.hardCount}</div>
                                <div className="text-sm text-gray-600">Hard</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{sessionStats.goodCount}</div>
                                <div className="text-sm text-gray-600">Good</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{sessionStats.easyCount}</div>
                                <div className="text-sm text-gray-600">Easy</div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    if (dueCards.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center space-y-4">
                        <div className="text-6xl">✅</div>
                        <h1 className="text-2xl font-bold text-gray-900">All Caught Up!</h1>
                        <p className="text-gray-600">No cards are due for review right now. Come back later!</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Session</h1>
                    <p className="text-gray-600">{deck?.topics?.join(", ") || "Studying"}</p>
                </div>

                {/* Study Session */}
                <StudySession
                    cards={dueCards}
                    onCardRated={handleCardRated}
                    onComplete={handleSessionComplete}
                />

                {/* Exit Button */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => {
                            if (confirm("Are you sure you want to exit? Your progress will be saved.")) {
                                router.push("/dashboard");
                            }
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Exit Session
                    </button>
                </div>
            </div>
        </main>
    );
}
