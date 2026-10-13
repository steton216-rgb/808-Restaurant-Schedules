// Recurring coverage requirements; these do not assign employees to shifts.
const server = (start, end, count=1) => ({ role: 'Server', start, end, count });
const bartender = (start, end) => ({ role: 'Bartender', start, end, count: 1 });
const weekdayDinner = () => [server('3 PM', '8 PM'), server('5 PM', 'Close')];
const pacificLunch = () => [server('10:30 AM', '2 PM'), server('11:30 AM', '3 PM')];
const host = () => ({ role: 'Host', start: '5 PM', end: '9 PM', count: 1 });
const corkLunch = () => [server('10:30 AM', '2:30 PM'), server('11 AM', '3 PM')];
const corkDinner = (weekend=false) => [server('3 PM', '7 PM'), server('4 PM', '8 PM', weekend?2:1), server('5 PM', 'Close'), bartender('5 PM', 'Close')];
const corkDays = (november=false) => [
  ...['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day=>({day, open:'11 AM', close:day==='Friday'?'10 PM':'9 PM', lunch:corkLunch(), dinner:corkDinner(day==='Friday')})),
  {day:'Saturday', open:november?'11 AM':'3 PM', close:'10 PM', lunch:november?corkLunch():[], dinner:corkDinner(true)},
  november?{day:'Sunday', open:'2 PM', close:'9 PM', lunch:[], dinner:[server('1:30 PM','6 PM'),server('4 PM','Close'),bartender('4 PM','Close')]}:{day:'Sunday', closed:true, lunch:[], dinner:[]}
];
export const staffing = {
  'twisted-cork': {
    name:'Twisted Cork Bistro',
    description:'Monday–Thursday dinner: 3 servers and 1 bartender. Friday and Saturday dinner: 4 servers and 1 bartender. Close follows each day’s service hours.',
    days:corkDays(),
    upcoming:{effectiveFrom:'2026-11-01', label:'Starting November 1, 2026', days:corkDays(true)}
  },
  pacific: {
    name: 'Pacific Eating House',
    description: 'Recurring weekly lunch and dinner requirements. Close is 9 PM daily. Hosts are listed separately from servers. Saturday dinner follows the updated four-server lineup.',
    notes: ['Andrew and Lillie alternate Friday closing shifts.', 'Tyler and Gabriel alternate Sunday dinner coverage.', 'Caleb overlaps Tyler while training.'],
    days: [
      { day: 'Monday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '8 PM'), server('5 PM', 'Close')] },
      { day: 'Tuesday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '8 PM'), server('4 PM', 'Close'), server('5 PM', 'Close')] },
      { day: 'Wednesday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '8 PM'), server('4 PM', 'Close'), server('5 PM', 'Close')] },
      { day: 'Thursday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '8 PM'), server('4 PM', '8 PM'), server('5 PM', 'Close')] },
      { day: 'Friday', open: '11 AM', close: '9 PM', lunch: pacificLunch(), dinner: [server('3 PM', '8 PM'), server('4:30 PM', '8 PM'), server('5 PM', '9 PM'), server('5 PM', 'Close', 2), host()] },
      { day: 'Saturday', open: '3 PM', close: '9 PM', lunch: [], dinner: [server('2:30 PM', '7:30 PM'), server('4 PM', '9 PM'), server('5 PM', 'Close', 2), host()] },
      { day: 'Sunday', open: '3 PM', close: '9 PM', lunch: [], dinner: [server('2:30 PM', '7:30 PM'), server('5 PM', 'Close')] }
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

export function staffingForDate(restaurantId, date) {
  const requirements=staffing[restaurantId];
  if(!requirements)return null;
  if(requirements.upcoming && date>=requirements.upcoming.effectiveFrom){
    const {upcoming,...current}=requirements;
    return {...current, days:upcoming.days};
  }
  return requirements;
}

export function shiftLabel(shift) {
  const role = shift.role.toLowerCase() + (shift.count === 1 ? '' : 's');
  return `${shift.count} ${role} · ${shift.start}${shift.end ? '–'+shift.end : ' start'}`;
}
