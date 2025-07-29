/**
 * Utility functions for calculating bonus points when tasks take longer than estimated
 */

/**
 * Calculate bonus points based on time spent vs estimated time
 * @param {number} timeSpentMinutes - Actual time spent on the task
 * @param {number} estimatedMinutes - Estimated time for the task
 * @returns {object} - { bonusPoints: number, explanation: string }
 */
export const calculateBonusPoints = (timeSpentMinutes, estimatedMinutes) => {
  // Input validation
  if (!timeSpentMinutes || !estimatedMinutes || timeSpentMinutes <= 0 || estimatedMinutes <= 0) {
    return { bonusPoints: 0, explanation: null };
  }

  // No bonus if task was completed within or under estimated time
  if (timeSpentMinutes <= estimatedMinutes) {
    return { bonusPoints: 0, explanation: null };
  }

  // Calculate overtime in minutes
  const overtimeMinutes = timeSpentMinutes - estimatedMinutes;
  
  // Calculate bonus points: 1 point per 5 minutes of overtime
  const bonusPoints = Math.floor(overtimeMinutes / 5);
  
  if (bonusPoints === 0) {
    return { bonusPoints: 0, explanation: null };
  }

  // Generate explanation text
  const explanation = `Bonus for overtid: ${overtimeMinutes} min over estimat (${estimatedMinutes} min) = ${bonusPoints} bonuspoeng`;
  
  return { bonusPoints, explanation };
};

/**
 * Calculate total points including bonus for a task completion
 * @param {number} basePoints - Base points for the task
 * @param {number} timeSpentMinutes - Actual time spent on the task
 * @param {number} estimatedMinutes - Estimated time for the task
 * @returns {object} - { totalPoints: number, bonusPoints: number, explanation: string }
 */
export const calculateTotalPoints = (basePoints, timeSpentMinutes, estimatedMinutes) => {
  const { bonusPoints, explanation } = calculateBonusPoints(timeSpentMinutes, estimatedMinutes);
  const totalPoints = (basePoints || 0) + bonusPoints;
  
  return {
    totalPoints,
    bonusPoints,
    explanation
  };
};

/**
 * Format bonus points explanation for display
 * @param {number} bonusPoints - Number of bonus points earned
 * @param {number} overtimeMinutes - Minutes over estimated time
 * @param {number} estimatedMinutes - Original estimated time
 * @returns {string} - Formatted explanation text
 */
export const formatBonusExplanation = (bonusPoints, overtimeMinutes, estimatedMinutes) => {
  if (bonusPoints === 0) {
    return null;
  }
  
  return `🎉 Bonus: ${overtimeMinutes} min over estimat (${estimatedMinutes} min) = +${bonusPoints} bonuspoeng`;
};