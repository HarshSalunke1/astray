// Exam Revision & Adaptive Constraint Solver Engine
import { getDynamicExamPlan } from './dateTime';

export const initialExamPlan = getDynamicExamPlan();

export function adaptiveReschedule(currentPlan) {
  return currentPlan.map((day, idx) => {
    if (day.day === 'Day 2' || idx === 1) {
      return {
        ...day,
        status: 'Adjusted (+45m added load)',
        sessions: [
          { time: '18:30 - 21:15', topic: '3NF/BCNF + Re-allocated Missed Normalization Practice', status: 'Pending', focus: 'Priority (High Load)' }
        ]
      };
    }
    if (day.day === 'Day 3' || idx === 2) {
      return {
        ...day,
        status: 'Adjusted (+30m review)',
        sessions: [
          { time: '18:00 - 20:30', topic: 'Transaction Management & Serializability', status: 'Pending', focus: 'Normal' },
          { time: '20:30 - 21:45', topic: 'Full Mock Exam Simulation (Decomposition Focus)', status: 'Pending', focus: 'High' }
        ]
      };
    }
    return day;
  });
}

