"use client";

import { useState } from "react";

interface FlipCardProps {
    question: string;
    answer: string;
    topic: string;
}

export function FlipCard({ question, answer, topic }: FlipCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="flip-card-container h-64 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
                {/* Front - Question */}
                <div className="flip-card-front bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {topic}
                    </div>
                    <h4 className="font-semibold text-lg mb-4 text-gray-800">
                        {question}
                    </h4>
                    <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                        Click to reveal
                    </div>
                </div>

                {/* Back - Answer */}
                <div className="flip-card-back bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                        Answer
                    </div>
                    <div className="text-gray-700 leading-relaxed">
                        {answer}
                    </div>
                    <div className="absolute bottom-4 right-4 text-xs text-blue-400">
                        Click to flip back
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
    );
}
