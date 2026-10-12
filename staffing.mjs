// Recurring coverage requirements; these do not assign employees to shifts.
const server = (start, end, count=1) => ({ role: 'Server', start, end, count });
const bartender = (start, end) => ({ role: 'Bartender', start, end, count: 1 });
const weekdayDinner = () => [server('3 PM', '8 PM'), server('5 PM', 'Close')];
export const staffing = {
  'pine-black': {
    name: 'Pine & Black',
    days: [
      { day: 'Monday', closed: true, lunch: [], dinner: [] },
      { day: 'Tuesday', open: '11 AM', close: '9 PM', lunch: [server('10:30 AM', null)], dinner: weekdayDinner() },
      { day: 'Wednesday', open: '11 AM', close: '9 PM', lunch: [server('10:30 AM', null)], dinner: weekdayDinner() },
      { day: 'Thursday', open: '11 AM', close: '9 PM', lunch: [server('10:30 AM', null)], dinner: weekdayDinner() },
      { day: 'Friday', open: '11 AM', close: '9 PM', lunch: [server('10:30 AM', null), server('11:30 AM', null)], dinner: [server('3 PM', '8 PM'), server('4 PM', '9 PM', 2), server('5 PM', 'Close'), bartender('5 PM', 'Close')] },
      { day: 'Saturday', open: '11 AM', close: '9 PM', lunch: [server('10:30 AM', null)], dinner: [server('3 PM', '8 PM'), server('4 PM', '9 PM'), server('5 PM', 'Close'), bartender('5 PM', 'Close')] },
      { day: 'Sunday', open: 'Noon', close: '8 PM', lunch: [server('11:30 AM', null)], dinner: [server('2 PM', '7 PM'), server('4 PM', 'Close')] }
    ]
  }
};

export function shiftLabel(shift) {
  const role = shift.role.toLowerCase() + (shift.count === 1 ? '' : 's');
  return `${shift.count} ${role} · ${shift.start}${shift.end ? '–'+shift.end : ' start'}`;
}
