import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface StudySession {
    id?: string;
    userId: string;
    deckId: string;
    startedAt: Date;
    completedAt: Date;
    cardsStudied: number;
    ratings: {
        again: number;
        hard: number;
        good: number;
        easy: number;
    };
}

export interface WrappedStats {
    totalCardsStudied: number;
    totalStudyTime: number; // in minutes
    sessionsCompleted: number;
    currentStreak: number;
    bestDeck: { deckId: string; cardsStudied: number } | null;
    averageAccuracy: number; // percentage of good/easy ratings
    totalDaysActive: number;
    studyTimeByHour: number[]; // 24-hour array
}

/**
 * Save a completed study session to Firebase
 */
export async function saveStudySession(session: Omit<StudySession, "id">): Promise<void> {
    try {
        await addDoc(collection(db, "studySessions"), {
            ...session,
            startedAt: Timestamp.fromDate(session.startedAt),
            completedAt: Timestamp.fromDate(session.completedAt),
        });
    } catch (error) {
        console.error("Error saving study session:", error);
        throw error;
    }
}

/**
 * Calculate wrapped statistics for a user
 */
export async function calculateWrappedStats(userId: string): Promise<WrappedStats> {
    try {
        const q = query(
            collection(db, "studySessions"),
            where("userId", "==", userId)
        );

        const querySnapshot = await getDocs(q);
        const sessions: StudySession[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startedAt: doc.data().startedAt.toDate(),
            completedAt: doc.data().completedAt.toDate(),
        } as StudySession));

        if (sessions.length === 0) {
            return {
                totalCardsStudied: 0,
                totalStudyTime: 0,
                sessionsCompleted: 0,
                currentStreak: 0,
                bestDeck: null,
                averageAccuracy: 0,
                totalDaysActive: 0,
                studyTimeByHour: new Array(24).fill(0),
            };
        }

        // Total cards studied
        const totalCardsStudied = sessions.reduce((sum, s) => sum + s.cardsStudied, 0);

        // Total study time (in minutes)
        const totalStudyTime = sessions.reduce((sum, s) => {
            const duration = (s.completedAt.getTime() - s.startedAt.getTime()) / 1000 / 60;
            return sum + duration;
        }, 0);

        // Sessions completed
        const sessionsCompleted = sessions.length;

        // Calculate streak
        const currentStreak = calculateStreak(sessions);

        // Best deck
        const deckStats = new Map<string, number>();
        sessions.forEach(s => {
            deckStats.set(s.deckId, (deckStats.get(s.deckId) || 0) + s.cardsStudied);
        });
        let bestDeck = null;
        let maxCards = 0;
        deckStats.forEach((cards, deckId) => {
            if (cards > maxCards) {
                maxCards = cards;
                bestDeck = { deckId, cardsStudied: cards };
            }
        });

        // Average accuracy (% of good/easy ratings)
        const totalRatings = sessions.reduce((sum, s) =>
            sum + s.ratings.again + s.ratings.hard + s.ratings.good + s.ratings.easy, 0
        );
        const goodRatings = sessions.reduce((sum, s) =>
            sum + s.ratings.good + s.ratings.easy, 0
        );
        const averageAccuracy = totalRatings > 0 ? (goodRatings / totalRatings) * 100 : 0;

        // Total days active
        const uniqueDays = new Set(
            sessions.map(s => s.completedAt.toISOString().split('T')[0])
        );
        const totalDaysActive = uniqueDays.size;

        // Study time by hour
        const studyTimeByHour = new Array(24).fill(0);
        sessions.forEach(s => {
            const hour = s.completedAt.getHours();
            const duration = (s.completedAt.getTime() - s.startedAt.getTime()) / 1000 / 60;
            studyTimeByHour[hour] += duration;
        });

        return {
            totalCardsStudied,
            totalStudyTime: Math.round(totalStudyTime),
            sessionsCompleted,
            currentStreak,
            bestDeck,
            averageAccuracy: Math.round(averageAccuracy),
            totalDaysActive,
            studyTimeByHour,
        };
    } catch (error) {
        console.error("Error calculating wrapped stats:", error);
        throw error;
    }
}

/**
 * Calculate current study streak (consecutive days)
 */
function calculateStreak(sessions: StudySession[]): number {
    if (sessions.length === 0) return 0;

    // Sort sessions by date (most recent first)
    const sortedSessions = [...sessions].sort(
        (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
    );

    // Get unique study dates
    const studyDates = Array.from(
        new Set(sortedSessions.map(s => s.completedAt.toISOString().split('T')[0]))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Check if most recent study was today or yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (studyDates[0] !== today && studyDates[0] !== yesterday) {
        return 0; // Streak broken
    }

    // Count consecutive days
    let streak = 1;
    for (let i = 1; i < studyDates.length; i++) {
        const currentDate = new Date(studyDates[i - 1]);
        const prevDate = new Date(studyDates[i]);
        const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / 86400000);

        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Get recent study sessions for preview
 */
export async function getRecentSessions(userId: string, limit: number = 5): Promise<StudySession[]> {
    try {
        const q = query(
            collection(db, "studySessions"),
            where("userId", "==", userId)
        );

        const querySnapshot = await getDocs(q);
        const sessions: StudySession[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startedAt: doc.data().startedAt.toDate(),
            completedAt: doc.data().completedAt.toDate(),
        } as StudySession));

        // Sort by completion date and limit
        return sessions
            .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
            .slice(0, limit);
    } catch (error) {
        console.error("Error fetching recent sessions:", error);
        return [];
    }
}
