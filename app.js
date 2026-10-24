import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { certificate, shifts, days } from './rules.mjs';
const $ = id => document.getElementById(id);
let client, profile, selectedRestaurant;
let approvedDays=[];
const status = (message, error=false) => { $('status').hidden=false; $('status').textContent=message; $('status').classList.toggle('error',error); };
const signedAt = value => new Date(value).toLocaleString('en-US',{timeZone:'America/Chicago'})+' Central';
const centralToday = () => {const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const part=type=>parts.find(p=>p.type===type).value;return part('year')+'-'+part('month')+'-'+part('day');};
const currentRequests = rows => rows.filter(row=>row.requested_date>=centralToday());
const check = result => { if(result.error) throw result.error; return result.data; };
const element = (tag,text) => { const e=document.createElement(tag); if(text!==undefined)e.textContent=text;return e; };
const managerHome=element('section');
managerHome.id='manager-home';managerHome.hidden=true;
$('portal').insertBefore(managerHome,$('schedule'));
[0,1].forEach(w=>{const preferences=element('fieldset');preferences.append(element('legend','Week '+(w+1)+' work preferences'));
[['preferred-shifts','Preferred shifts per week','1','99'],['preferred-hours','Preferred hours per week','0.25','168']].forEach(([id,title,step,max])=>{id+=w?'-week2':'';const label=element('label',title),input=element('input');label.htmlFor=id;input.id=id;input.type='number';input.min='0';input.max=max;input.step=step;input.placeholder='Optional';preferences.append(label,input);});
preferences.append(element('small','Enter either or both. These are preferences, not guaranteed shifts or hours.'));
$('availability-form').insertBefore(preferences,$('certification').closest('label'));});
const selections = parent => [...parent.querySelectorAll('input:checked')].map(x=>x.value);
function shiftInputs(parent, name, chosen=[]) {
  shifts.forEach(shift=>{const label=element('label'),input=element('input');input.type='checkbox';input.name=name;input.value=shift;input.checked=chosen.includes(shift);label.append(input,document.createTextNode(shift));parent.append(label);});
  parent.addEventListener('change',event=>{if(event.target.value==='All Day' && event.target.checked)parent.querySelectorAll('input').forEach(x=>{x.checked=x.value==='All Day';});else if(event.target.checked)parent.querySelector('input[value="All Day"]').checked=false;});
}
[0,1].forEach(week=>{const group=element('fieldset');group.append(element('legend','Week '+(week+1)));days.forEach((day,i)=>{const details=element('details'),summary=element('summary',day+' — shifts I cannot work');details.id='day-'+(week*7+i);details.append(summary);shiftInputs(details,'week-'+week+'-'+day);group.append(details);});$('weekdays').append(group);});
shiftInputs($('request-shifts'),'request');
$('certification-text').textContent=certificate;
const shiftTypeLabels={unspecified:'Not specified',single:'Single shift only',split:'Split shift only',either:'Either single or split'};
const shiftTab=element('a','Single or Split Shifts');shiftTab.href='#shift-types';$('portal').querySelector('nav').append(shiftTab);
const shiftPanel=element('fieldset');shiftPanel.id='shift-types';shiftPanel.append(element('legend','Single or Split Shifts'),element('p','Choose what you can work each day. A single shift is one work period; a split shift is two work periods separated by a break. These choices repeat with your two-week availability. Unavailable shifts above still apply. Certify, sign, and finalize availability below to save all changes.'));
[0,1].forEach(w=>{const week=element('fieldset');week.append(element('legend','Week '+(w+1)));days.forEach((day,i)=>{const label=element('label',day),select=element('select');select.id='shift-type-'+w+'-'+i;label.htmlFor=select.id;Object.entries(shiftTypeLabels).forEach(([value,text])=>{const option=element('option',text);option.value=value;select.append(option);});week.append(label,select);});shiftPanel.append(week);});$('availability-form').insertBefore(shiftPanel,$('certification').closest('label'));
async function busy(form, action){const button=form.querySelector('button');button.disabled=true;try{await action();}catch(e){status(e.message||'Unable to complete your request. Please try again.',true);}finally{button.disabled=false;}}
function fullSchedule(schedule, employeeName){
 const section=element('section');section.className='full-schedule';
 if(!schedule){section.append(element('p','The next schedule has not been published yet.'));return section;}
 const weeks=schedule.schedule_data.weeks;
 if(schedule.restaurant_id==='twisted-cork')section.append(element('p','Sunday hours: 3:00–9:00 p.m.')); 
 section.append(element('small','Blue = approved time off. Approved shifts are labeled in each cell.'),element('h3','Full two-week team schedule'),element('p','Schedule starting '+schedule.starts_on),element('small','Scroll each table sideways to see every day.'));
 weeks.forEach((week,index)=>{const wrap=element('div'),table=element('table'),head=element('thead'),body=element('tbody'),row=element('tr');
 const title='Week '+(index+1)+' · '+week.headers[1]+' – '+week.headers[7];
 section.append(element('h4',title));wrap.className='tablewrap';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',title);
 table.append(element('caption',title));week.headers.forEach(value=>{const th=element('th',value);th.scope='col';row.append(th);});head.append(row);
 week.rows.forEach(values=>{const tr=element('tr');if(employeeName&&values[0]===employeeName)tr.className='my-shifts';values.forEach((value,i)=>{const cell=element(i===0?'th':'td',value??'—');if(i===0)cell.scope='row';
 if(i>=1&&i<=7){const date=new Date(schedule.starts_on+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+index*7+i-1);const day=date.toISOString().slice(0,10);const approved=approvedDays.filter(r=>r.restaurant_id===schedule.restaurant_id&&r.full_name===values[0]&&r.requested_date===day);const publishedTimeOff=/\b(?:time[ -]?off|approved[ -]?off|pto)\b/i.test(String(value));if(approved.length||publishedTimeOff){cell.classList.add('approved-time-off');const label=element('small',approved.length?'Approved time off: '+[...new Set(approved.flatMap(r=>r.shifts))].join(', '):'Approved time off');cell.append(label);}}
 tr.append(cell);});body.append(tr);});table.append(head,body);wrap.append(table);section.append(wrap);
 });return section;
}
async function loadSchedule(){
 const schedules=check(await client.from('schedules').select('*').eq('restaurant_id',profile.restaurant_id).order('starts_on',{ascending:false}).limit(1));
 const root=$('schedule-content');root.replaceChildren(fullSchedule(schedules[0],profile.full_name));
 if(schedules.length&&!schedules[0].schedule_data.weeks.some(week=>week.rows.some(row=>row[0]===profile.full_name)))root.append(element('p','You are not listed on this published schedule yet. You can still view your restaurant’s full schedule and submit availability or future time-off requests.'));
}
function showSundayHours(){
 if(profile.restaurant_id!=='twisted-cork')return;
 const note=element('p','Twisted Cork is open Sundays, 3:00–9:00 p.m. Set your Sunday availability for both Week 1 and Week 2.');note.className='status';$('weekdays').prepend(note);
 [6,13].forEach(i=>{const day=$('day-'+i);day.querySelector('summary').textContent='Sunday · 3:00–9:00 p.m. — shifts I cannot work';labelSundayShifts(day,true);});
 const hours=element('p','Sunday hours: 3:00–9:00 p.m.');$('restaurant').after(hours);
}
function labelSundayShifts(parent,sunday){
 parent.querySelectorAll('input[type=checkbox]').forEach(input=>{const label=input.closest('label');label.hidden=sunday&&input.value==='Lunch';if(label.hidden&&parent.id==='request-shifts')input.checked=false;const text=sunday?({'3–7':'3:00–7:00 p.m.','5–Close':'5:00–9:00 p.m.','All Day':'All Sunday · 3:00–9:00 p.m.'}[input.value]||input.value):input.value;label.lastChild.textContent=text;});
}
async function loadAvailability(){const a=check(await client.from('availability').select('*').eq('employee_id',profile.id).maybeSingle());[0,1].forEach(w=>days.forEach((_,i)=>$('shift-type-'+w+'-'+i).value=a?.shift_types?.[w]?.[i]??'unspecified'));$('preferred-shifts').value=a?.preferred_shifts??'';$('preferred-hours').value=a?.preferred_hours??'';$('preferred-shifts-week2').value=(a?.workload_week2?a.workload_week2.shifts:a?.preferred_shifts)??'';$('preferred-hours-week2').value=(a?.workload_week2?a.workload_week2.hours:a?.preferred_hours)??'';if(a){[a.unavailable,a.unavailable_week2??a.unavailable].forEach((week,w)=>days.forEach((_,i)=>$('day-'+(w*7+i)).querySelectorAll('input').forEach(x=>x.checked=(week[i]||[]).includes(x.value))));$('last-saved').textContent='Last finalized: '+signedAt(a.certified_at);} $('certification').checked=false;$('signature').value='';}
async function loadRequests(){const rows=currentRequests(check(await client.from('time_off').select('*').eq('employee_id',profile.id).order('requested_date')));const root=$('requests');root.replaceChildren();if(!rows.length)root.textContent='No current or upcoming time-off requests.';rows.forEach(row=>root.append(element('p',`${row.requested_date} · ${row.shifts.join(', ')} · ${row.status}`)));}
async function deadline(){
 if(profile?.restaurant_id==='twisted-cork'){const date=$('request-date').value;labelSundayShifts($('request-shifts'),!!date&&new Date(date+'T00:00:00Z').getUTCDay()===0);}
 if(!$('request-date').value)return;
 try {const result=check(await client.rpc('request_window',{day_requested:$('request-date').value}));$('deadline').textContent=`Schedule starts ${result.starts_on}. Requests close ${result.deadline_label} Central. ${result.open?'Requests are open.':'Requests are closed for this schedule.'}`;$('request-submit').disabled=!result.open;}catch(e){status(e.message,true);$('request-submit').disabled=true;}
}
const calendarViews=new Map();
function timeOffCalendar(restaurantId,requests,names){
 const section=element('section');section.className='time-off-calendar card';section.id='time-off-calendar';
 const today=centralToday();let view=calendarViews.get(restaurantId)||{month:today.slice(0,7),day:today};calendarViews.set(restaurantId,view);
 const render=()=>{
 section.replaceChildren(element('h3','Time-off calendar'),element('p','Daily counts: req = requested, pend = pending, appr = approved, decl = declined. Select a day to review employees and shifts. Past requests are hidden.'));
 const toolbar=element('div');toolbar.className='calendar-toolbar';
 const previous=element('button','←'),next=element('button','→'),current=element('button','This month'),title=element('strong');
 const first=new Date(view.month+'-01T00:00:00Z');title.textContent=first.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});title.setAttribute('aria-live','polite');
 previous.type=next.type=current.type='button';previous.setAttribute('aria-label','Previous month');next.setAttribute('aria-label','Next month');previous.disabled=view.month<=today.slice(0,7);
 const move=delta=>{first.setUTCMonth(first.getUTCMonth()+delta);view.month=first.toISOString().slice(0,7);view.day=view.month===today.slice(0,7)?today:view.month+'-01';render();};previous.onclick=()=>move(-1);next.onclick=()=>move(1);current.onclick=()=>{view.month=today.slice(0,7);view.day=today;render();};toolbar.append(previous,title,next,current);section.append(toolbar);
 const grid=element('div');grid.className='calendar-grid';['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>grid.append(element('strong',d)));
 const offset=(first.getUTCDay()+6)%7;for(let i=0;i<offset;i++){const blank=element('span');blank.setAttribute('aria-hidden','true');grid.append(blank);}
 const total=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 for(let n=1;n<=total;n++){const date=view.month+'-'+String(n).padStart(2,'0'),rows=requests.filter(r=>r.requested_date===date),count=state=>new Set(rows.filter(r=>!state||r.status===state).map(r=>r.employee_id)).size;
 const button=element('button');button.type='button';button.className='calendar-day';button.disabled=date<today;button.setAttribute('aria-pressed',String(view.day===date));button.setAttribute('aria-label',date+': '+count()+' requested, '+count('pending')+' pending, '+count('approved')+' approved, '+count('declined')+' declined');button.append(element('strong',n));
 if(rows.length){[['','requested'],['pending','pending'],['approved','approved'],['declined','declined']].forEach(([state,label])=>{if(state&&count(state)===0)return;const badge=element('small',count(state)+' '+({requested:'req',pending:'pend',approved:'appr',declined:'decl'}[label]));badge.title=count(state)+' '+label;badge.className='request-count '+(state||'total');button.append(badge);});}button.onclick=()=>{view.day=date;render();};grid.append(button);}
 section.append(grid);const details=element('div');details.className='calendar-requests';details.setAttribute('aria-live','polite');details.append(element('h4','Requests for '+view.day));
 const selected=requests.filter(r=>r.requested_date===view.day);if(!selected.length)details.append(element('p','No time-off requests for this day.'));
 selected.forEach(r=>{const box=element('div');box.className='card';box.append(element('strong',names[r.employee_id]||'Employee'),element('p','Shifts: '+r.shifts.join(', ')),element('p','Status: '+r.status));if(r.note)box.append(element('p',r.note));
 [['approved','Approve'],['declined','Decline'],['pending','Mark pending']].forEach(([value,label])=>{if(r.status===value)return;const button=element('button',label);button.type='button';button.onclick=async()=>{const controls=[...section.querySelectorAll('button')];controls.forEach(b=>b.disabled=true);try{check(await client.from('time_off').update({status:value}).eq('id',r.id).eq('restaurant_id',restaurantId));await managerReview();}catch(e){status(e.message,true);render();}};box.append(button);});details.append(box);});section.append(details);
 };render();return section;
}
async function managerReview(){
 approvedDays=check(await client.rpc('approved_schedule_time_off'))||[];
 const restaurantId=selectedRestaurant||profile.restaurant_id;
 const [peopleResult,availabilityResult,requestsResult,scheduleResult,directoryResult]=await Promise.all([client.from('profiles').select('*').eq('restaurant_id',restaurantId),client.from('availability').select('*').eq('restaurant_id',restaurantId),client.from('time_off').select('*').eq('restaurant_id',restaurantId).order('requested_date'),client.from('schedules').select('*').eq('restaurant_id',restaurantId).order('starts_on',{ascending:false}).limit(1),profile.role==='owner'?client.rpc('employee_directory',{store:restaurantId}):Promise.resolve({data:null})]);
 if(profile.role==='owner'&&selectedRestaurant!==restaurantId)return;
 const people=check(peopleResult),availability=check(availabilityResult),requests=currentRequests(check(requestsResult)),names=Object.fromEntries(people.map(p=>[p.id,p.full_name]));const root=$('manager-content');root.replaceChildren();root.append(element('h3','Regular availability'));
 const published=check(scheduleResult);root.prepend(fullSchedule(published[0]));
 people.filter(p=>p.role!=='owner').forEach(p=>{const a=availability.find(x=>x.employee_id===p.id),box=element('div');box.className='card';box.append(element('strong',p.full_name));if(!a)box.append(element('p','Not submitted'));else{[a.unavailable,a.unavailable_week2??a.unavailable].forEach((week,w)=>{box.append(element('h4','Week '+(w+1)));const pref=w?(a.workload_week2??{shifts:a.preferred_shifts,hours:a.preferred_hours}):{shifts:a.preferred_shifts,hours:a.preferred_hours};box.append(element('p','Preferred shifts: '+(pref.shifts??'Not specified')),element('p','Preferred hours: '+(pref.hours??'Not specified')));days.forEach((d,i)=>box.append(element('p',d+': '+(week[i].join(', ')||'No restrictions')+' · '+shiftTypeLabels[a.shift_types?.[w]?.[i]??'unspecified'])));});box.append(element('small',`Signed by ${a.signature} · Last finalized: ${signedAt(a.certified_at)}`),element('small',a.certificate_text));}root.append(box);});

 if(profile.role==='owner')root.prepend(employeeManagement(restaurantId,check(directoryResult)));
 root.prepend(timeOffCalendar(restaurantId,requests,names));
}
async function changeEmployee(restaurantId,action,employeeId,fullName){
 const {data,error}=await client.auth.getSession();if(error)throw error;
 if(!data.session)throw Error('Reopen your private manager link before changing employees.');
 const response=await fetch(window.APP_CONFIG.url.replace(/\/$/,'')+'/functions/v1/manage-employees',{method:'POST',headers:{'Content-Type':'application/json',apikey:window.APP_CONFIG.key,Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action,restaurant_id:restaurantId,employee_id:employeeId,full_name:fullName}),cache:'no-store'});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Unable to update this employee.');
 if(selectedRestaurant!==restaurantId)return;
 await managerReview();
 const output=$('employee-link-result');
 if(result.link){
  const label=element('label','Private link for '+result.full_name),input=element('input'),copy=element('button','Copy private link');input.type='text';input.readOnly=true;input.value=result.link;input.id='issued-employee-link';label.htmlFor=input.id;copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(result.link);copy.textContent='Link copied';}catch{input.focus();input.select();copy.textContent='Press Ctrl+C to copy';}};
  output.replaceChildren(label,input,copy,element('small','Save this link and give it only to this employee. If you lose it, use Replace private link. Earlier links stop working when replaced or reactivated.'));
 }else output.textContent='Employee access deactivated. Their history and published schedules are preserved.';
 output.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function employeeManagement(restaurantId,employees){
 const section=element('section');section.className='card';section.id='employee-management';
 section.append(element('h3','Manage Employees'),element('p','Add employees to this restaurant or deactivate access when someone leaves. Published schedules and past records stay on file.'));
 const form=element('form'),label=element('label','New employee name'),input=element('input'),add=element('button','Add employee & create private link');
 input.id='new-employee-name';input.required=true;input.minLength=2;input.maxLength=150;input.autocomplete='off';label.htmlFor=input.id;add.type='submit';form.append(label,input,add);form.onsubmit=e=>{e.preventDefault();busy(form,()=>changeEmployee(restaurantId,'add',undefined,input.value));};section.append(form);
 const output=element('div');output.id='employee-link-result';output.setAttribute('aria-live','polite');section.append(output,element('h4','Employee access'));
 if(!employees.length)section.append(element('p','No employees added yet.'));
 employees.forEach(employee=>{const row=element('div');row.className='card';row.append(element('strong',employee.full_name),element('small',employee.active?'Active':'Inactive — access disabled'));
 const actions=employee.active?[['deactivate','Deactivate access'],['replace_link','Replace private link']]:[['reactivate','Reactivate & create new link']];
 actions.forEach(([action,text])=>{const button=element('button',text);button.type='button';button.onclick=async()=>{
  if(action==='replace_link'&&!window.confirm('Replace the private link for '+employee.full_name+'? Their old link will stop working.'))return;
  const controls=[...section.querySelectorAll('button')];controls.forEach(c=>c.disabled=true);
  try{await changeEmployee(restaurantId,action,employee.id);}catch(e){status(e.message,true);controls.forEach(c=>c.disabled=false);}
 };row.append(button);});section.append(row);});
 return section;
}
async function ownerHome(){
 const [restaurantResult,scheduleResult]=await Promise.all([client.from('restaurants').select('*').order('name'),client.from('schedules').select('*').order('starts_on',{ascending:false})]);
 const restaurants=check(restaurantResult),published=check(scheduleResult);
 selectedRestaurant=null;
 managerHome.replaceChildren(element('h2','Your restaurants'),element('p','View each restaurant’s full two-week schedule below. Select a restaurant to manage employees, review availability, and approve or decline time-off requests.'));
 const back=element('button','← All restaurants');back.type='button';back.onclick=()=>{selectedRestaurant=null;$('manager').hidden=true;managerHome.querySelectorAll('.full-schedule').forEach((view,i)=>view.replaceWith(fullSchedule(published.find(s=>s.restaurant_id===restaurants[i].id))));managerHome.hidden=false;};$('manager').prepend(back);
 restaurants.forEach(restaurant=>{const button=element('button'),logo=element('img');button.type='button';button.className='restaurant-card';logo.src=restaurant.id+'/logo.png';logo.alt='';button.append(logo,element('strong',restaurant.name),element('small','Schedules · Availability · Time-off requests'));button.onclick=async()=>{selectedRestaurant=restaurant.id;managerHome.hidden=true;$('manager').hidden=false;$('manager').querySelector('h2').textContent=restaurant.name;$('manager-content').textContent='Loading…';try{await managerReview();}catch(e){status(e.message,true);}};const card=element('section');card.className='card';card.append(button,fullSchedule(published.find(s=>s.restaurant_id===restaurant.id)));managerHome.append(card);});
 $('restaurant').textContent='808 Manager Home';$('identity').textContent='Private manager access · All three restaurants';$('logo').hidden=true;$('portal').querySelector('nav').hidden=true;
 ['schedule','availability','time-off','manager'].forEach(id=>$(id).hidden=true);
 managerHome.hidden=false;$('login').hidden=true;$('portal').hidden=false;$('status').hidden=true;
}
async function openPortal(){
 profile=check(await client.from('profiles').select('*').eq('id',(await client.auth.getUser()).data.user.id).single());
 approvedDays=check(await client.rpc('approved_schedule_time_off'))||[];
 if(profile.role==='owner'){await ownerHome();return;}
 const restaurant=check(await client.from('restaurants').select('*').eq('id',profile.restaurant_id).single());
 $('restaurant').textContent=restaurant.name;$('identity').textContent=profile.full_name;$('logo').src=restaurant.id+'/logo.png';$('logo').alt=restaurant.name+' logo';
 showSundayHours();
 await Promise.all([loadSchedule(),loadAvailability(),loadRequests()]);$('login').hidden=true;$('portal').hidden=false;$('manager').hidden=profile.role!=='manager';if(profile.role==='manager')await managerReview();$('status').hidden=true;
}
$('availability-form').onsubmit=e=>{e.preventDefault();busy(e.target,async()=>{if(!$('certification').checked||!$('signature').value.trim())throw Error('Please certify and enter your full-name signature.');check(await client.rpc('save_availability',{daily_shift_types:[0,1].map(w=>days.map((_,i)=>$('shift-type-'+w+'-'+i).value)),restrictions:days.map((_,i)=>selections($('day-'+i))),restrictions_week2:days.map((_,i)=>selections($('day-'+(7+i)))),preferences_week2:{shifts:$('preferred-shifts-week2').value===''?null:Number($('preferred-shifts-week2').value),hours:$('preferred-hours-week2').value===''?null:Number($('preferred-hours-week2').value)},signed_name:$('signature').value.trim(),accepted:$('certification').checked,preferred_shift_count:$('preferred-shifts').value===''?null:Number($('preferred-shifts').value),preferred_hour_count:$('preferred-hours').value===''?null:Number($('preferred-hours').value)}));await loadAvailability();status('Your regular availability has been finalized.');});};
$('request-form').onsubmit=e=>{e.preventDefault();busy(e.target,async()=>{const chosen=selections($('request-shifts'));if(!chosen.length)throw Error('Select at least one shift or All Day.');check(await client.from('time_off').insert({employee_id:profile.id,restaurant_id:profile.restaurant_id,requested_date:$('request-date').value,shifts:chosen,note:$('request-note').value.trim()}));e.target.reset();if(profile.restaurant_id==='twisted-cork')labelSundayShifts($('request-shifts'),false);$('deadline').textContent='';await loadRequests();status('Request submitted for manager review.');});};
$('request-date').onchange=deadline;
$('refresh-manager').onclick=()=>managerReview().catch(e=>status(e.message,true));
$('logout').onclick=async()=>{try{check(await client.auth.signOut());location.reload();}catch(e){status(e.message,true);}};
const privateToken=new URLSearchParams(location.hash.slice(1)).get('employee');
// Remove the access secret from the address bar and current history entry.
if(privateToken)history.replaceState(null,'',location.pathname+location.search);
if(!window.APP_CONFIG?.url||!window.APP_CONFIG?.key){
 status('Your private employee page is awaiting activation. Please contact your manager.',true);
}else{
 client=createClient(window.APP_CONFIG.url,window.APP_CONFIG.key);
 try{
  if(privateToken){
   // A newly opened link must take precedence over another employee's session.
   check(await client.auth.signOut({scope:'local'}));
   status('Opening your private employee page…');
   const response=await fetch(window.APP_CONFIG.url.replace(/\/$/,'')+'/functions/v1/employee-link',{method:'POST',headers:{'Content-Type':'application/json',apikey:window.APP_CONFIG.key},body:JSON.stringify({token:privateToken}),cache:'no-store'});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Unable to open your private link.');
   check(await client.auth.setSession({access_token:result.access_token,refresh_token:result.refresh_token}));
   await openPortal();
  }else{
   const {data,error}=await client.auth.getSession();if(error)throw error;if(data.session)await openPortal();
  }
 }catch(e){status(e.message,true);}
 client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){profile=null;$('portal').hidden=true;$('login').hidden=false;}});
}
