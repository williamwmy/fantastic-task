/**
 * @vitest-environment jsdom
 */
import { 
  calculateBonusPoints, 
  calculateTotalPoints, 
  formatBonusExplanation 
} from './bonusPointsUtils.js';

describe('Bonus Points Calculation', () => {
  describe('calculateBonusPoints', () => {
    it('should return 0 bonus points when task is completed within estimated time', () => {
      const result = calculateBonusPoints(25, 30);
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();
    });

    it('should return 0 bonus points when task is completed exactly at estimated time', () => {
      const result = calculateBonusPoints(30, 30);
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();
    });

    it('should return 1 bonus point for 5-9 minutes overtime', () => {
      // 5 minutes overtime
      let result = calculateBonusPoints(35, 30);
      expect(result.bonusPoints).toBe(1);
      expect(result.explanation).toBe('Bonus for overtid: 5 min over estimat (30 min) = 1 bonuspoeng');

      // 9 minutes overtime
      result = calculateBonusPoints(39, 30);
      expect(result.bonusPoints).toBe(1);
      expect(result.explanation).toBe('Bonus for overtid: 9 min over estimat (30 min) = 1 bonuspoeng');
    });

    it('should return 2 bonus points for 10-14 minutes overtime', () => {
      // 10 minutes overtime
      let result = calculateBonusPoints(40, 30);
      expect(result.bonusPoints).toBe(2);
      expect(result.explanation).toBe('Bonus for overtid: 10 min over estimat (30 min) = 2 bonuspoeng');

      // 14 minutes overtime
      result = calculateBonusPoints(44, 30);
      expect(result.bonusPoints).toBe(2);
      expect(result.explanation).toBe('Bonus for overtid: 14 min over estimat (30 min) = 2 bonuspoeng');
    });

    it('should return 0 bonus points for less than 5 minutes overtime', () => {
      // 1 minute overtime
      let result = calculateBonusPoints(31, 30);
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();

      // 4 minutes overtime
      result = calculateBonusPoints(34, 30);
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();
    });

    it('should handle large overtime correctly', () => {
      // 25 minutes overtime = 5 bonus points
      const result = calculateBonusPoints(55, 30);
      expect(result.bonusPoints).toBe(5);
      expect(result.explanation).toBe('Bonus for overtid: 25 min over estimat (30 min) = 5 bonuspoeng');
    });

    it('should return 0 bonus points for invalid input', () => {
      // Null/undefined inputs
      expect(calculateBonusPoints(null, 30).bonusPoints).toBe(0);
      expect(calculateBonusPoints(30, null).bonusPoints).toBe(0);
      expect(calculateBonusPoints(undefined, 30).bonusPoints).toBe(0);
      expect(calculateBonusPoints(30, undefined).bonusPoints).toBe(0);

      // Zero inputs
      expect(calculateBonusPoints(0, 30).bonusPoints).toBe(0);
      expect(calculateBonusPoints(30, 0).bonusPoints).toBe(0);

      // Negative inputs
      expect(calculateBonusPoints(-5, 30).bonusPoints).toBe(0);
      expect(calculateBonusPoints(30, -5).bonusPoints).toBe(0);
    });

    it('should handle edge cases', () => {
      // Very small numbers
      const result1 = calculateBonusPoints(6, 1);
      expect(result1.bonusPoints).toBe(1);
      expect(result1.explanation).toBe('Bonus for overtid: 5 min over estimat (1 min) = 1 bonuspoeng');

      // Exact multiple of 5
      const result2 = calculateBonusPoints(45, 30);
      expect(result2.bonusPoints).toBe(3);
      expect(result2.explanation).toBe('Bonus for overtid: 15 min over estimat (30 min) = 3 bonuspoeng');
    });
  });

  describe('calculateTotalPoints', () => {
    it('should return base points when no bonus is earned', () => {
      const result = calculateTotalPoints(10, 25, 30);
      expect(result.totalPoints).toBe(10);
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();
    });

    it('should return base points plus bonus when overtime occurs', () => {
      const result = calculateTotalPoints(10, 35, 30);
      expect(result.totalPoints).toBe(11);
      expect(result.bonusPoints).toBe(1);
      expect(result.explanation).toBe('Bonus for overtid: 5 min over estimat (30 min) = 1 bonuspoeng');
    });

    it('should handle zero base points', () => {
      const result = calculateTotalPoints(0, 35, 30);
      expect(result.totalPoints).toBe(1);
      expect(result.bonusPoints).toBe(1);
      expect(result.explanation).toBe('Bonus for overtid: 5 min over estimat (30 min) = 1 bonuspoeng');
    });

    it('should handle null/undefined base points', () => {
      const result = calculateTotalPoints(null, 35, 30);
      expect(result.totalPoints).toBe(1);
      expect(result.bonusPoints).toBe(1);
      expect(result.explanation).toBe('Bonus for overtid: 5 min over estimat (30 min) = 1 bonuspoeng');
    });

    it('should calculate complex scenarios correctly', () => {
      // 20 points base + 15 minutes overtime (3 bonus points)
      const result = calculateTotalPoints(20, 45, 30);
      expect(result.totalPoints).toBe(23);
      expect(result.bonusPoints).toBe(3);
      expect(result.explanation).toBe('Bonus for overtid: 15 min over estimat (30 min) = 3 bonuspoeng');
    });
  });

  describe('formatBonusExplanation', () => {
    it('should return null when no bonus points', () => {
      const result = formatBonusExplanation(0, 0, 30);
      expect(result).toBeNull();
    });

    it('should format bonus explanation correctly', () => {
      const result = formatBonusExplanation(2, 10, 30);
      expect(result).toBe('🎉 Bonus: 10 min over estimat (30 min) = +2 bonuspoeng');
    });

    it('should handle single bonus point', () => {
      const result = formatBonusExplanation(1, 5, 15);
      expect(result).toBe('🎉 Bonus: 5 min over estimat (15 min) = +1 bonuspoeng');
    });

    it('should handle large bonus', () => {
      const result = formatBonusExplanation(10, 50, 30);
      expect(result).toBe('🎉 Bonus: 50 min over estimat (30 min) = +10 bonuspoeng');
    });
  });

  describe('Realistic Task Scenarios', () => {
    it('should handle "Rydde rommet" scenario', () => {
      // Task: Clean room, estimated 30 min, took 40 min, 10 points base
      const result = calculateTotalPoints(10, 40, 30);
      expect(result.totalPoints).toBe(12); // 10 base + 2 bonus
      expect(result.bonusPoints).toBe(2);
      expect(result.explanation).toBe('Bonus for overtid: 10 min over estimat (30 min) = 2 bonuspoeng');
    });

    it('should handle "Ta ut søppel" scenario', () => {
      // Task: Take out trash, estimated 10 min, took 12 min, 5 points base
      const result = calculateTotalPoints(5, 12, 10);
      expect(result.totalPoints).toBe(5); // 5 base + 0 bonus (only 2 min over)
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();
    });

    it('should handle "Lage middag" scenario', () => {
      // Task: Make dinner, estimated 45 min, took 65 min, 15 points base
      const result = calculateTotalPoints(15, 65, 45);
      expect(result.totalPoints).toBe(19); // 15 base + 4 bonus (20 min over = 4 bonus)
      expect(result.bonusPoints).toBe(4);
      expect(result.explanation).toBe('Bonus for overtid: 20 min over estimat (45 min) = 4 bonuspoeng');
    });

    it('should handle "Mate kjæledyr" quick task', () => {
      // Task: Feed pets, estimated 5 min, took 8 min, 3 points base
      const result = calculateTotalPoints(3, 8, 5);
      expect(result.totalPoints).toBe(3); // 3 base + 0 bonus (only 3 min over)
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();
    });

    it('should handle "Klippe gresset" big task', () => {
      // Task: Mow lawn, estimated 90 min, took 120 min, 30 points base
      const result = calculateTotalPoints(30, 120, 90);
      expect(result.totalPoints).toBe(36); // 30 base + 6 bonus (30 min over = 6 bonus)
      expect(result.bonusPoints).toBe(6);
      expect(result.explanation).toBe('Bonus for overtid: 30 min over estimat (90 min) = 6 bonuspoeng');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle tasks with no estimated time', () => {
      const result = calculateTotalPoints(10, 30, 0);
      expect(result.totalPoints).toBe(10);
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();
    });

    it('should handle tasks with no time spent', () => {
      const result = calculateTotalPoints(10, 0, 30);
      expect(result.totalPoints).toBe(10);
      expect(result.bonusPoints).toBe(0);
      expect(result.explanation).toBeNull();
    });

    it('should handle floating point minutes', () => {
      const result = calculateTotalPoints(10, 35.7, 30.2);
      expect(result.totalPoints).toBe(11); // 10 base + 1 bonus (5.5 min over, floor to 1 bonus)
      expect(result.bonusPoints).toBe(1);
      // Use regex to handle floating point precision issues
      expect(result.explanation).toMatch(/Bonus for overtid: 5\.5\d* min over estimat \(30\.2 min\) = 1 bonuspoeng/);
    });

    it('should handle very large numbers', () => {
      const result = calculateTotalPoints(100, 1000, 500);
      expect(result.totalPoints).toBe(200); // 100 base + 100 bonus (500 min over = 100 bonus)
      expect(result.bonusPoints).toBe(100);
      expect(result.explanation).toBe('Bonus for overtid: 500 min over estimat (500 min) = 100 bonuspoeng');
    });
  });
});

describe('Integration with Task Completion Flow', () => {
  it('should correctly calculate bonus for typical task completion', () => {
    // Simulate a task completion where user spent more time than estimated
    const taskData = {
      id: 'task-1',
      points: 15,
      estimated_minutes: 30
    };
    
    const completionData = {
      time_spent_minutes: 45, // 15 minutes over estimate
      comment: 'Took longer than expected but got it done!'
    };
    
    const { totalPoints, bonusPoints, explanation } = calculateTotalPoints(
      taskData.points,
      completionData.time_spent_minutes,
      taskData.estimated_minutes
    );
    
    expect(totalPoints).toBe(18); // 15 base + 3 bonus
    expect(bonusPoints).toBe(3);
    expect(explanation).toBe('Bonus for overtid: 15 min over estimat (30 min) = 3 bonuspoeng');
  });

  it('should handle task completion with no bonus', () => {
    const taskData = {
      id: 'task-2',
      points: 8,
      estimated_minutes: 20
    };
    
    const completionData = {
      time_spent_minutes: 18, // Under estimate
      comment: 'Finished quickly!'
    };
    
    const { totalPoints, bonusPoints, explanation } = calculateTotalPoints(
      taskData.points,
      completionData.time_spent_minutes,
      taskData.estimated_minutes
    );
    
    expect(totalPoints).toBe(8); // Just base points
    expect(bonusPoints).toBe(0);
    expect(explanation).toBeNull();
  });
});