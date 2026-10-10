/**
 * Centralized Date & Time Engine for ASTRA Study OS
 * Configured for Asia/Kolkata timezone consistency with backend
 */

export function getSystemTimeContext(backendTimeContext = null) {
  if (backendTimeContext && backendTimeContext.display_date) {
    return backendTimeContext;
  }

  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata' };

  const dayOfWeek = new Intl.DateTimeFormat('en-US', { ...options, weekday: 'long' }).format(now);
  const monthLong = new Intl.DateTimeFormat('en-US', { ...options, month: 'long' }).format(now);
  const monthShort = new Intl.DateTimeFormat('en-US', { ...options, month: 'short' }).format(now);
  const dayNum = new Intl.DateTimeFormat('en-US', { ...options, day: 'numeric' }).format(now);
  const year = new Intl.DateTimeFormat('en-US', { ...options, year: 'numeric' }).format(now);

  const display_date = `${dayOfWeek}, ${monthShort} ${dayNum} ${year}`.toUpperCase();
  const today_schedule_header = `${dayOfWeek}, ${monthLong} ${dayNum}`;
  
  const time_str = new Intl.DateTimeFormat('en-US', {
    ...options,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(now);

  const short_date = new Intl.DateTimeFormat('en-CA', options).format(now); // YYYY-MM-DD

  return {
    iso_datetime: now.toISOString(),
    day_of_week: dayOfWeek,
    date_str: `${monthLong} ${dayNum}, ${year}`,
    short_date,
    display_date,
    today_schedule_header,
    time_str,
    timezone: 'Asia/Kolkata'
  };
}

/**
 * Dynamically computes multi-day exam revision schedule starting from current date.
 * Day 1 = Today
 * Day 2 = Tomorrow
 * Day 3 = Day 3
 * Day 4 = Exam Day (Day 4)
 */
export function getDynamicExamPlan(backendTimeContext = null) {
  const baseDate = new Date();

  function formatDateOffset(offsetDays) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offsetDays);
    const dayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(d);
    const monthShort = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'short' }).format(d);
    const dayNum = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(d);
    return `${dayName}, ${monthShort} ${dayNum}`;
  }

  return [
    {
      day: 'Day 1',
      date: formatDateOffset(0),
      status: 'Completed',
      isToday: true,
      sessions: [
        { time: '19:00 - 20:30', topic: 'Functional Dependencies & 1NF/2NF', status: 'Done', focus: 'High' }
      ]
    },
    {
      day: 'Day 2',
      date: formatDateOffset(1),
      status: 'Scheduled',
      isToday: false,
      sessions: [
        { time: '19:00 - 21:00', topic: '3NF vs BCNF Decomposition & Lossless Join', status: 'Pending', focus: 'Priority (Weak Subject)' }
      ]
    },
    {
      day: 'Day 3',
      date: formatDateOffset(2),
      status: 'Scheduled',
      isToday: false,
      sessions: [
        { time: '18:30 - 20:30', topic: 'Transaction Management & Serializability', status: 'Pending', focus: 'Normal' },
        { time: '20:30 - 21:30', topic: 'Mock Practice & Weak Topic Flashcards', status: 'Pending', focus: 'High' }
      ]
    },
    {
      day: 'Day 4',
      date: `${formatDateOffset(3)} (Exam Day)`,
      status: 'Exam Day',
      isToday: false,
      sessions: [
        { time: '08:00 - 09:30', topic: 'Final Formula Warmup & Key Definitions', status: 'Scheduled', focus: 'Review' },
        { time: '10:00 - 13:00', topic: '⚡ DBMS FINAL EXAM', status: 'Exam', focus: 'Critical' }
      ]
    }
  ];
}
