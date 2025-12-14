/**
 * SM-2 Algorithm for Spaced Repetition
 * Based on SuperMemo SM-2 algorithm
 */

export interface CardProgress {
    easinessFactor: number; // Default 2.5
    interval: number; // Days until next review
    repetitions: number; // Number of consecutive correct reviews
    nextReviewDate: Date;
    lastReviewedAt: Date;
}

export type Rating = 0 | 1 | 2 | 3; // 0: Again, 1: Hard, 2: Good, 3: Easy

/**
 * Calculate next review parameters based on user rating
 */
export function calculateNextReview(
    currentProgress: Partial<CardProgress> | null,
    rating: Rating
): CardProgress {
    // Initialize defaults for new cards
    const easinessFactor = currentProgress?.easinessFactor ?? 2.5;
    const interval = currentProgress?.interval ?? 1;
    const repetitions = currentProgress?.repetitions ?? 0;

    let newEasinessFactor = easinessFactor;
    let newInterval = interval;
    let newRepetitions = repetitions;

    // Update easiness factor (SM-2 formula)
    newEasinessFactor = Math.max(
        1.3,
        easinessFactor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02))
    );

    // Calculate interval based on rating
    if (rating < 2) {
        // Again or Hard: Reset to beginning
        newRepetitions = 0;
        newInterval = 1;
    } else {
        // Good or Easy: Increase interval
        newRepetitions = repetitions + 1;

        if (newRepetitions === 1) {
            newInterval = 1;
        } else if (newRepetitions === 2) {
            newInterval = 6;
        } else {
            newInterval = Math.round(interval * newEasinessFactor);
        }

        // Ease modifier: Easy cards get bonus interval
        if (rating === 3) {
            newInterval = Math.round(newInterval * 1.3);
        }
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
        easinessFactor: newEasinessFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        nextReviewDate,
        lastReviewedAt: new Date(),
    };
}

/**
 * Check if a card is due for review
 */
export function isCardDue(progress: CardProgress | null): boolean {
    if (!progress) return true; // New cards are always due
    return new Date() >= new Date(progress.nextReviewDate);
}

/**
 * Get rating label text
 */
export function getRatingLabel(rating: Rating): string {
    const labels = {
        0: "Forgot",
        1: "Struggled",
        2: "Got It",
        3: "Too Easy",
    };
    return labels[rating];
}

/**
 * Get rating description for help text
 */
export function getRatingDescription(rating: Rating): string {
    const descriptions = {
        0: "Didn't know the answer - Review soon",
        1: "Took a while to remember - Review in 1-2 days",
        2: "Answered correctly - Review in a few days",
        3: "Knew it instantly - Review in weeks",
    };
    return descriptions[rating];
}

/**
 * Get rating color for UI
 */
export function getRatingColor(rating: Rating): string {
    const colors = {
        0: "bg-red-500 hover:bg-red-600",
        1: "bg-orange-500 hover:bg-orange-600",
        2: "bg-green-500 hover:bg-green-600",
        3: "bg-blue-500 hover:bg-blue-600",
    };
    return colors[rating];
}
