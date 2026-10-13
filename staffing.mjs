// Recurring coverage requirements; these do not assign employees to shifts.
const server = (start, end, count=1) => ({ role: 'Server', start, end, count });
const bartender = (start, end) => ({ role: 'Bartender', start, end, count: 1 });
const weekdayDinner = () => [server('3 PM', '8 PM'), server('5 PM', 'Close')];
const pacificLunch = () => [server('10:30 AM', '2 PM'), server('11:30 AM', '3 PM')];
const host = () => ({ role: 'Host', start: '5 PM', end: '8 PM', count: 1 });
export const staffing = {
  pacific: {
    name: 'Pacific Eating House',
    description: 'Weekday lunch requirements and dinner coverage from the October 5–18, 2026 spreadsheet. Close is 9 PM daily. Dinner includes Caleb’s training shifts; hosts are listed separately. Saturday dinner requires 4 servers on Nebraska home-game days and 5 on other Saturdays, plus a host.',
    notes: ['Andrew and Lillie alternate Friday closing shifts.', 'Tyler and Gabriel alternate Sunday dinner coverage.', 'Caleb overlaps Tyler while training.'],
    days: [
      { day: 'Monday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', 'Close')] },
      { day: 'Tuesday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '7 PM'), server('5 PM', 'Close', 2)] },
      { day: 'Wednesday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '7 PM', 2), server('5 PM', 'Close', 2)] },
      { day: 'Thursday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '7 PM'), server('5 PM', 'Close', 3)] },
      { day: 'Friday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '7 PM'), server('4:30 PM', '8:30 PM', 2), server('5 PM', 'Close'), host()] },
      { day: 'Saturday', open: '3 PM', close: '9 PM', lunch: [], dinner: [server('2:30 PM', '7 PM'), server('3 PM', '7 PM'), server('4 PM', '8 PM'), server('5 PM', 'Close'), server('5 PM', '9 PM'), host()], dinnerHomeGame: [server('2:30 PM', '7 PM'), server('3 PM', '7 PM'), server('4 PM', '8 PM'), server('5 PM', 'Close'), host()] },
      { day: 'Sunday', open: '3 PM', close: '9 PM', lunch: [], dinner: [server('2:30 PM', '9 PM'), server('4 PM', '9 PM')] }
    ]
  },
  'pine-black': {
    name: 'Pine & Black',
    description: 'Recurring weekly coverage. Lunch end times are not specified. Close is 9 PM Tuesday–Saturday and 8 PM Sunday.',
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
