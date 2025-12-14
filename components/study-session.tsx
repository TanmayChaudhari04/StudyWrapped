"use client";

import { useState } from "react";
import { Rating, getRatingLabel, getRatingColor, getRatingDescription } from "@/lib/sm2";

interface Card {
    question: string;
    answer: string;
    topic: string;
}

interface StudySessionProps {
    cards: Card[];
    onCardRated: (cardIndex: number, rating: Rating) => Promise<void>;
    onComplete: (sessionStats: SessionStats) => void;
}

export interface SessionStats {
    totalCards: number;
    againCount: number;
    hardCount: number;
    goodCount: number;
    easyCount: number;
}

export function StudySession({ cards, onCardRated, onComplete }: StudySessionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isRating, setIsRating] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [stats, setStats] = useState<SessionStats>({
        totalCards: cards.length,
        againCount: 0,
        hardCount: 0,
        goodCount: 0,
        easyCount: 0,
    });

    const currentCard = cards[currentIndex];
    const progress = ((currentIndex) / cards.length) * 100;

    const handleRating = async (rating: Rating) => {
        if (isRating) return;
        setIsRating(true);

        // Update stats
        const newStats = { ...stats };
        if (rating === 0) newStats.againCount++;
        else if (rating === 1) newStats.hardCount++;
        else if (rating === 2) newStats.goodCount++;
        else if (rating === 3) newStats.easyCount++;
        setStats(newStats);

        // Save progress
        await onCardRated(currentIndex, rating);

        // Move to next card or complete
        if (currentIndex + 1 < cards.length) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
            setIsRating(false);
            setShowHelp(false); // Reset help on new card
        } else {
            onComplete(newStats);
        }
    };

    if (!currentCard) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500">No cards to study!</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress Bar */}
            <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Card {currentIndex + 1} of {cards.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Card Display */}
            <div
                className="flip-card-container h-96 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
                    {/* Front - Question */}
                    <div className="flip-card-front bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                            {currentCard.topic}
                        </div>
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                            {currentCard.question}
                        </h2>
                        <div className="absolute bottom-6 right-6 text-sm text-gray-400">
                            Click to reveal answer
                        </div>
                    </div>

                    {/* Back - Answer */}
                    <div className="flip-card-back bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg border-2 border-blue-200">
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">
                            Answer
                        </div>
                        <div className="text-lg text-gray-700 leading-relaxed mb-6">
                            {currentCard.answer}
                        </div>
                    </div>
                </div>

                <style jsx>{`
          .flip-card-container {
            perspective: 1000px;
          }

          .flip-card {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.6s;
            transform-style: preserve-3d;
          }

          .flip-card.flipped {
            transform: rotateY(180deg);
          }

          .flip-card-front,
          .flip-card-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
          }

          .flip-card-back {
            transform: rotateY(180deg);
          }
        `}</style>
            </div>

            {/* Rating Buttons */}
            {isFlipped && (
                <div className="space-y-3">
                    {/* Help Toggle */}
                    <div className="text-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowHelp(!showHelp);
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            {showHelp ? "Hide" : "What do these mean?"}
                        </button>
                    </div>

                    {/* Help Section */}
                    {showHelp && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
                            <p className="font-semibold text-blue-900">How to rate your answer:</p>
                            {([0, 1, 2, 3] as Rating[]).map((rating) => (
                                <div key={rating} className="flex items-start gap-2">
                                    <span className="font-medium text-gray-700">{getRatingLabel(rating)}:</span>
                                    <span className="text-gray-600">{getRatingDescription(rating)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rating Buttons Grid */}
                    <div className="grid grid-cols-4 gap-3">
                        {([0, 1, 2, 3] as Rating[]).map((rating) => (
                            <button
                                key={rating}
                                onClick={() => handleRating(rating)}
                                disabled={isRating}
                                className={`${getRatingColor(rating)} text-white py-4 px-4 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {getRatingLabel(rating)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!isFlipped && (
                <div className="text-center text-gray-500 text-sm">
                    Flip the card to see the answer and rate yourself
                </div>
            )}
        </div>
    );
}
