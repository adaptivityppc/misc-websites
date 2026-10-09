import {escapeHTML as e} from './store.js';
import {stops, tourMeta} from './tour-data.js?v=tour-mobile-2';

const HOLD=2300, FLIGHT=1900;
const shortDate=date=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const longDate=date=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));

export function showStatus(stop,now=new Date()){
  // Use each show's local calendar day; never classify by the viewer's timezone.
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:stop.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value=type=>parts.find(p=>p.type===type).value;
  const today=`${value('year')}-${value('month')}-${value('day')}`;
  return stop.date>today?'upcoming':stop.date===today?'today':'past';
}

export function project(stop){
  const rad=Math.PI/180, p1=29.5*rad, p2=45.5*rad;
  const n=(Math.sin(p1)+Math.sin(p2))/2, c=Math.cos(p1)**2+2*n*Math.sin(p1);
  const rho0=Math.sqrt(c-2*n*Math.sin(38*rad))/n;
  const rho=Math.sqrt(c-2*n*Math.sin(stop.lat*rad))/n, theta=n*(stop.lon+96)*rad;
  return {x:480+1100*rho*Math.sin(theta),y:380-1100*(rho0-rho*Math.cos(theta))};
}

function curve(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy),bend=Math.min(distance*.14,48);
  return {x:(a.x+b.x)/2+(distance?dy/distance*bend:0),y:(a.y+b.y)/2-(distance?dx/distance*bend:0)};
}
export function flightPath(a,b){const c=curve(a,b);return `M${a.x},${a.y} Q${c.x},${c.y} ${b.x},${b.y}`;}
export function flightPoint(a,b,t){
  t=Math.max(0,Math.min(1,t));const c=curve(a,b),u=1-t;
  return {x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y,
    angle:Math.atan2(2*u*(c.y-a.y)+2*t*(b.y-c.y),2*u*(c.x-a.x)+2*t*(b.x-c.x))*180/Math.PI};
}
export function travelProgress(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
export function mapCamera(point,width,height,follow=false){
  const scale=Math.min(width/1000,height/620)*(follow?2.35:1);
  return {scale,x:follow?width/2-point.x*scale:(width-1000*scale)/2,
    y:follow?height/2-point.y*scale:(height-620*scale)/2};
}
export function groupStops(items){
  const groups=new Map();items.forEach((stop,index)=>{const key=`${stop.city}|${stop.region}|${stop.country}`;
    if(!groups.has(key))groups.set(key,{stop,indices:[]});groups.get(key).indices.push(index);});
  return [...groups.values()];
}

// A deterministic clock preserves the exact flight position across pause/resume.
export function createTourPlayer(count,reduced=false){
  const state={index:0,elapsed:0,phase:'hold',progress:0,playing:false};
  return {state,
    setReduced(value){reduced=Boolean(value);},
    play(){if(state.index===count-1&&state.phase==='done')this.select(0);state.playing=count>0;},
    pause(){state.playing=false;},
    select(index){state.index=Math.max(0,Math.min(count-1,Number(index)||0));state.elapsed=0;state.progress=0;state.phase='hold';state.playing=false;},
    tick(delta){
      if(!state.playing)return state;
      let remaining=Math.max(0,delta);
      while(remaining>0&&state.playing){
        const duration=state.phase==='hold'?HOLD:reduced?0:FLIGHT;
        const consumed=Math.min(remaining,Math.max(0,duration-state.elapsed));state.elapsed+=consumed;remaining-=consumed;
        state.progress=state.phase==='flight'&&duration?state.elapsed/duration:0;
        if(state.elapsed<duration)break;
        state.elapsed=0;state.progress=0;
        if(state.phase==='hold'){
          if(state.index>=count-1){state.phase='done';state.playing=false;}
          else state.phase='flight';
        }else{state.index++;state.phase='hold';}
      }
      return state;
    }
  };
}

const playIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3l11 7-11 7z" fill="currentColor"/></svg>';
const pauseIcon='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3h3v14H5zM12 3h3v14h-3z" fill="currentColor"/></svg>';
const positions=stops.map(project);
const groups=groupStops(stops);

export function concertPhotoMarkup(stop){
  const photo=stop.photo;if(!photo)return '';
  const label=photo.kind==='city'?'City view':photo.kind==='venue'?'Venue view':'Concert photo';
  const license=photo.license?`<br><a href="${e(photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${e(photo.license)}</a> · Resized; cropped for display`:'';
  return `<a href="${e(photo.source)}" target="_blank" rel="noopener noreferrer" aria-label="${e(label)}: view the original photo from ${e(stop.city)}"><img src="${e(photo.src)}" width="${photo.width}" height="${photo.height}" alt="${e(photo.alt)}" style="object-position:${e(photo.position||'center')}" decoding="async"></a><figcaption><span class="tour-photo-kind">${e(label)}</span> · <a href="${e(photo.source)}" target="_blank" rel="noopener noreferrer">${e(photo.credit)} <span aria-hidden="true">↗</span></a>${license}</figcaption>`;
}

export function renderTour(now=new Date()){
  return `<section id="on-the-road" class="tour-section" aria-labelledby="tour-title">
    <header class="tour-header"><div class="reveal"><span class="tour-eyebrow">Post Malone / The 2026 chapter</span><h2 id="tour-title" class="display">ON THE ROAD.</h2><p>One show. One city. Another chapter.</p></div><div class="tour-header-note"><span>THE TOUR JOURNAL</span><span>North America · 2026</span></div></header>
    <div class="tour-console" data-tour>
      <div class="tour-stage-layout">
        <div class="tour-map-window" tabindex="0" aria-label="Concert map. Pause the journey to see the full map, then select a dot to explore a show.">
          <div class="tour-map-canvas">
            <img class="tour-basemap" src="/assets/tour/north-america.svg?v=tour-mobile-2" width="1000" height="620" alt="" loading="lazy" decoding="async">
            <svg class="tour-route-map" viewBox="0 0 1000 620" aria-hidden="true">
              <g class="tour-planned-routes">${positions.slice(1).map((point,i)=>`<path d="${flightPath(positions[i],point)}" class="${showStatus(stops[i+1],now)==='past'?'':'is-future'}"/>`).join('')}</g>
              <g class="tour-travelled-routes">${positions.slice(1).map((point,i)=>`<path data-tour-leg="${i}" d="${flightPath(positions[i],point)}" pathLength="1"/>`).join('')}</g>
              <g data-tour-plane class="tour-plane" transform="translate(${positions[0].x} ${positions[0].y})"><circle r="19" class="tour-plane-halo"/><path d="M14 0L4-3L-2-10H-5L-2-2H-10L-13-5H-15L-13 0L-15 5H-13L-10 2H-2L-5 10H-2L4 3Z"/></g>
            </svg>
            ${groups.map(({stop,indices})=>{const p=project(stop),future=indices.some(i=>showStatus(stops[i],now)!=='past');return `<button type="button" class="tour-pin ${future?'is-future':''}" style="left:${p.x/10}%;top:${p.y/6.2}%" data-tour-pin="${indices[0]}" aria-label="${e(stop.city)}, ${e(stop.region)} — ${indices.map(i=>longDate(stops[i].date)).join(' and ')}${future?' — upcoming':''}" aria-pressed="false"><span></span></button>`;}).join('')}
            <div class="tour-map-label" data-tour-label aria-hidden="true"></div>
            <span class="tour-map-stamp" aria-hidden="true">AP / FIELD NOTES<br>VOLUME 2026</span>
          </div>
          <span class="tour-mobile-hint" data-tour-map-hint>Tap a dot to explore</span>
        </div>
      <div class="tour-controls">
        <div class="tour-transport"><button type="button" class="tour-play" data-tour-play aria-label="Play tour animation">${playIcon}<span>Play the journey</span></button><button type="button" class="tour-restart" data-tour-restart aria-label="Restart tour animation">↺</button></div>
        <div class="tour-legend"><span><i class="past"></i>Past shows</span><span><i class="current"></i>Selected stop</span><span><i class="future"></i>Upcoming</span></div>
        <div class="tour-next-prev"><button type="button" data-tour-prev aria-label="Previous concert">←</button><button type="button" data-tour-next aria-label="Next concert">→</button></div>
      </div>
        <aside class="tour-stop-card" aria-label="Selected concert">
          <div class="tour-card-top"><span data-tour-counter>01 / ${stops.length}</span><span class="tour-status" data-tour-status>Past show</span></div>
          <div class="tour-card-main"><p class="tour-flight-status" data-tour-flight>At the first stop</p><h3 data-tour-city>${e(stops[0].city)}</h3><p class="tour-region" data-tour-region>${e(stops[0].region)} / ${e(stops[0].country)}</p><figure class="tour-photo" data-tour-photo hidden></figure><div class="tour-card-rule"></div><time data-tour-date datetime="${stops[0].date}">${longDate(stops[0].date)}</time><p class="tour-venue" data-tour-venue>${e(stops[0].venue)}</p><p class="tour-show-note" data-tour-note></p><div class="tour-other-dates" data-tour-other-dates></div></div>
          <a data-tour-source href="${e(stops[0].source)}" target="_blank" rel="noopener noreferrer">Show details <span aria-hidden="true">↗</span></a>
        </aside>
      </div>
      <div class="tour-timeline-heading"><span>THE TIMELINE / ${stops.length} SHOWS</span><span>Choose a date or a dot to explore <span aria-hidden="true">↗</span></span></div>
      <div class="tour-timeline" aria-label="Concert timeline">${stops.map((stop,i)=>`<button type="button" data-tour-select="${i}" class="tour-timeline-stop ${showStatus(stop,now)==='past'?'':'is-future'}" aria-pressed="false" aria-label="${e(stop.city)}, ${e(stop.region)} — ${longDate(stop.date)}"><span class="tour-timeline-date">${shortDate(stop.date)} <span>2026</span></span><span class="tour-timeline-dot"></span><span class="tour-timeline-city">${e(stop.city)}</span><span class="tour-timeline-region">${e(stop.abbr)} / ${e(stop.country)}</span></button>`).join('')}</div>
      <span class="tour-screen-reader" data-tour-announcement aria-live="polite"></span>
    </div>
    <div class="tour-footnote"><span>The BIG ASS Stadium Tour Part 2 & festival appearances · Dates checked Oct 9, 2026</span><a href="${tourMeta.source}" target="_blank" rel="noopener noreferrer">Official tour updates ↗</a></div>
  </section>`;
}

let cleanup=()=>{};
export function disposeTour(){cleanup();cleanup=()=>{};}
export function setupTour(root=document){
  disposeTour();const host=root.querySelector('[data-tour]');if(!host)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 760px)');
  const player=createTourPlayer(stops.length,reduced.matches),q=selector=>host.querySelector(selector);
  const pins=[...host.querySelectorAll('[data-tour-pin]')],timeline=[...host.querySelectorAll('[data-tour-select]')];
  const legs=[...host.querySelectorAll('[data-tour-leg]')],plane=q('[data-tour-plane]'),label=q('[data-tour-label]');
  const mapWindow=q('.tour-map-window'),canvas=q('.tour-map-canvas');
  let camera=null,viewport={width:mapWindow.clientWidth,height:mapWindow.clientHeight};
  let frame=0,lastTime=null,activeIndex=-1,lastPhase='',lastPlaying=null,inView=false,visited=false,disposed=false,cardAnimation=null;
  const listeners=[];
  const on=(target,event,fn)=>{target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));};
  function announce(){const stop=stops[player.state.index];q('[data-tour-announcement]').textContent=`${stop.city}, ${stop.region}. ${longDate(stop.date)}. ${stop.venue}.`;
  }
  function paint(delta=16){
    const s=player.state,stop=stops[s.index];
    if(activeIndex!==s.index){
      activeIndex=s.index;lastPhase='';q('[data-tour-counter]').textContent=`${String(s.index+1).padStart(2,'0')} / ${stops.length}`;
      const status=showStatus(stop);q('[data-tour-status]').textContent=status==='upcoming'?'Upcoming':status==='today'?'Today':'Past show';q('[data-tour-status]').classList.toggle('is-future',status!=='past');
      q('[data-tour-city]').textContent=stop.city;q('[data-tour-region]').textContent=`${stop.region} / ${stop.country}`;
      q('[data-tour-date]').textContent=longDate(stop.date);q('[data-tour-date]').setAttribute('datetime',stop.date);
      const photo=q('[data-tour-photo]');photo.hidden=!stop.photo;photo.innerHTML=concertPhotoMarkup(stop);
      q('[data-tour-venue]').textContent=stop.venue;q('[data-tour-note]').textContent=stop.note||'';q('[data-tour-source]').href=stop.source;
      cardAnimation?.cancel();
      if(!reduced.matches)cardAnimation=q('.tour-card-main').animate?.([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.2,.7,.2,1)'});
      const group=groups.find(g=>g.indices.includes(s.index));
      q('[data-tour-other-dates]').innerHTML=group.indices.length>1?`<span>Two nights in ${e(stop.city)}</span>${group.indices.map(i=>`<button type="button" data-tour-select="${i}" aria-pressed="${i===s.index}">${shortDate(stops[i].date)}</button>`).join('')}`:'';
      pins.forEach(pin=>{const selected=Number(pin.dataset.tourPin)===group.indices[0];pin.classList.toggle('is-selected',selected);pin.setAttribute('aria-pressed',String(selected));});
      timeline.forEach((button,i)=>{button.classList.toggle('is-selected',i===s.index);button.setAttribute('aria-pressed',String(i===s.index));});
      const strip=q('.tour-timeline'),button=timeline[s.index];
      strip.scrollTo({left:button.offsetLeft-strip.offsetLeft-(strip.clientWidth-button.offsetWidth)/2,behavior:reduced.matches?'instant':'smooth'});
      const p=positions[s.index];label.style.left=`${p.x/10}%`;label.style.top=`${p.y/6.2}%`;label.classList.toggle('is-below',p.y<110);label.innerHTML=`<strong>${e(stop.city)}</strong><span>${shortDate(stop.date)}, 2026</span>`;
      q('[data-tour-prev]').disabled=s.index===0;q('[data-tour-next]').disabled=s.index===stops.length-1;
    }
    if(lastPhase!==s.phase||lastPlaying!==s.playing){
      lastPhase=s.phase;lastPlaying=s.playing;host.classList.toggle('is-playing',s.playing);host.classList.toggle('is-flying',s.phase==='flight');
      q('[data-tour-flight]').textContent=s.phase==='flight'?`On the way to ${stops[s.index+1].city}`:s.phase==='done'?'Journey complete':showStatus(stop)!=='past'?'Next chapter':s.index===0?'At the first stop':'At this stop';
      q('[data-tour-play]').innerHTML=s.playing?`${pauseIcon}<span>Pause the journey</span>`:`${playIcon}<span>${s.phase==='done'?'Replay the journey':'Play the journey'}</span>`;
      q('[data-tour-play]').setAttribute('aria-label',s.playing?'Pause tour animation':'Play tour animation');
    }
    const progress=travelProgress(s.progress);
    legs.forEach((leg,i)=>{leg.classList.toggle('is-recent',i===s.index-1);leg.classList.toggle('is-active',i===s.index&&s.phase==='flight');leg.style.strokeDashoffset=String(i<s.index?0:i===s.index&&s.phase==='flight'?1-progress:1);});
    const p=s.phase==='flight'?flightPoint(positions[s.index],positions[s.index+1],progress):{...positions[s.index],angle:0};
    plane.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${p.angle})`);
    const follow=mobile.matches&&s.playing&&!reduced.matches;
    host.classList.toggle('is-following',follow);
    q('[data-tour-map-hint]').textContent=follow?'Following the journey · Pause to explore':'Tap a dot to explore';
    if(mobile.matches&&viewport.width>0&&viewport.height>0){
      const target=mapCamera(p,viewport.width,viewport.height,follow);
      if(!camera||!follow)camera=target;
      else{const alpha=1-Math.exp(-Math.max(0,delta)/180);for(const key of ['x','y','scale'])camera[key]+=(target[key]-camera[key])*alpha;}
      canvas.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
      canvas.style.setProperty('--tour-camera-scale',String(camera.scale));
    }else{camera=null;canvas.style.transform='';canvas.style.removeProperty('--tour-camera-scale');}
  }
  function pause(){player.pause();cancelAnimationFrame(frame);frame=0;lastTime=null;paint();}
  function step(time){
    if(disposed||!player.state.playing)return;
    const elapsed=lastTime===null?0:Math.min(time-lastTime,100);lastTime=time;player.tick(elapsed);paint(elapsed);
    if(player.state.playing)frame=requestAnimationFrame(step);else{frame=0;lastTime=null;announce();}
  }
  function play(){visited=true;if(document.hidden)return;player.play();paint();lastTime=null;cancelAnimationFrame(frame);frame=requestAnimationFrame(step);}
  function select(index){visited=true;pause();player.select(index);paint();announce();}
  on(host,'click',event=>{
    const button=event.target.closest('button');if(!button||!host.contains(button))return;
    if(button.hasAttribute('data-tour-play')){visited=true;player.state.playing?pause():play();}
    else if(button.hasAttribute('data-tour-restart')){select(0);if(!reduced.matches)play();}
    else if(button.hasAttribute('data-tour-prev'))select(player.state.index-1);
    else if(button.hasAttribute('data-tour-next'))select(player.state.index+1);
    else if(button.hasAttribute('data-tour-select'))select(button.dataset.tourSelect);
    else if(button.hasAttribute('data-tour-pin'))select(button.dataset.tourPin);
  });
  // Keyboard exploration always pauses autoplay so focus cannot chase moving stops.
  on(host,'focusin',event=>{if(event.target.matches('[data-tour-pin],[data-tour-select]')){visited=true;pause();}});
  on(document,'visibilitychange',()=>{if(document.hidden)pause();});
  on(reduced,'change',()=>{visited=true;player.setReduced(reduced.matches);pause();});
  function resize(){viewport={width:mapWindow.clientWidth,height:mapWindow.clientHeight};camera=null;paint();}
  on(mobile,'change',resize);
  let mapObserver;
  if(typeof ResizeObserver!=='undefined'){mapObserver=new ResizeObserver(resize);mapObserver.observe(mapWindow);}
  else if(window.addEventListener)on(window,'resize',resize);
  let observer;
  if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView)pause();else if(!visited&&!reduced.matches)play();},{threshold:.25});observer.observe(q('.tour-map-window'));}
  paint();
  cleanup=()=>{disposed=true;player.pause();cancelAnimationFrame(frame);cardAnimation?.cancel();observer?.disconnect();mapObserver?.disconnect();listeners.forEach(off=>off());};
}
