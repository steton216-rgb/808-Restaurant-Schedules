export function centralDate(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value=type=>parts.find(part=>part.type===type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function scheduleEnd(startsOn) {
  const end=new Date(startsOn+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+13);return end.toISOString().slice(0,10);
}
export function visibleSchedules(schedules,today=centralDate()) {
  const sorted=[...schedules].sort((a,b)=>a.starts_on.localeCompare(b.starts_on));
  const current=sorted.filter(s=>s.starts_on<=today&&scheduleEnd(s.starts_on)>=today).at(-1);
  const upcoming=sorted.find(s=>s.starts_on>today);
  return [{label:'Current schedule',schedule:current},{label:'Upcoming schedule',schedule:upcoming}].filter(item=>item.schedule);
}
export function employeeScheduleName(schedule,name) {
  return schedule.schedule_data.employee_aliases?.[name]||name;
}
export function isOpenShiftRow(row) {return /^OPEN(?:\s|$)/i.test(String(row[0]));}
export function employeeRows(schedule,week,name) {
  const canonical=employeeScheduleName(schedule,name);
  return week.rows.filter(row=>!isOpenShiftRow(row)&&(row[0]===name||row[0]===canonical));
}
