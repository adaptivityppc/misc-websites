import {categories,escapeHTML as e,money,filterProducts,priceHTML,addToBag,bagTotal} from './store.js';
import {motionMarkup,setupMotion,disposeMotion,pauseMotion,setMotionEnabled} from './motion.js';
import {renderTour,setupTour,disposeTour} from './tour.js?v=tour-mobile-2';

let products=[], catalog={}, currentProduct=null, galleryIndex=0, selectedVariant=null;
let bag=[];
try { bag=JSON.parse(localStorage.getItem('ap-concept-bag')||'[]'); if(!Array.isArray(bag)) bag=[]; } catch { bag=[]; }
const main=document.querySelector('#main');
const arrow='<span aria-hidden="true">↗</span>';
const productURL=p=>`/products/${p.handle}/`;
const collectionURL=c=>`/collections/${c}/`;
const find=h=>products.find(p=>p.handle===h);
const photo=(src,alt,cls='',eager=false)=>`<img src="${e(src)}" alt="${e(alt)}" class="${cls}" loading="${eager?'eager':'lazy'}" decoding="async">`;
const button=(href,label,cls='')=>`<a class="button ${cls}" href="${href}"><span>${label}</span>${arrow}</a>`;
const label=(number,text)=>`<div class="section-label"><span>${number}</span><span>${text}</span></div>`;
const productCaption=p=>`<p class="product-caption">${e(p.title)}<br><span>${e(p.color)}</span></p>`;
const productPrice=p=>`<p class="price">${priceHTML(p)}</p>`;
function imageCard(p,index=0,cls='') {
  const matchedModel=cls.split(' ').includes('model-image')&&p.handle==='rodeo-slim-fit-jeans-lt-indigo'&&index===2;
  const still=matchedModel?'/assets/motion/highland-model-turn-poster.webp':p.gallery[index]||p.gallery[0];
  const content = `<a class="image-card ${cls}" href="${productURL(p)}" aria-label="Explore ${e(p.title)} in ${e(p.color)}">${photo(still,`${p.title} — ${p.color}`)}<span class="image-link-indicator" aria-hidden="true">↗</span></a>`;
  const films={
    'feature-image':['sherpa-lined-puffer-jacket-beige',0,'puffer-lifestyle.mp4','Outpost Sherpa Puffer film'],
    'shirt-image':['daybreak-denim-shirt',0,'daybreak-lifestyle.mp4','Daybreak Denim Shirt film'],
    'model-image':['rodeo-slim-fit-jeans-lt-indigo',2,'highland-model-turn-matched.mp4','Highland Slim Cut model turn'],
    'tee-image':['standard-tee-3',0,'tobacco-tee-lifestyle.mp4','Standard Tee film']
  };
  const film=Object.entries(films).find(([key,[handle,view]])=>cls.split(' ').includes(key)&&p.handle===handle&&index===view)?.[1];
  return film?motionMarkup(content,`/assets/motion/${film[2]}`,film[3],cls):content;
}

function renderSocial(){
  const instagram='https://www.instagram.com/austinpost/';
  const icon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>';
  const edit=[
    ['road-show','Ash-Tray Road Show','Austin Post graphic tees and hoodies hanging on a sunlit chain-link fence'],
    ['paris-runway','At First Light','A model wearing Austin Post star-embroidered denim and a cowboy hat on the Paris runway','https://www.instagram.com/p/DOEqOO9CVaE/','50% 0%'],
    ['denim-fw26','A study in denim','Austin Post jeans in layered indigo washes with embroidered leather labels'],
    ['paris-post-malone','Thank you, Paris!','Post Malone waving to guests in a denim outfit and cowboy hat at the Austin Post Paris show','https://www.instagram.com/p/DOEqdIuCe4p/','50% 100%']
  ];
  return `<section class="social-section" aria-labelledby="social-title"><div class="social-header reveal"><div><h2 id="social-title" class="display">THE AP WORLD.</h2><p>New chapters. Everyday details. Austin Post.</p></div><a class="social-follow" href="${instagram}" target="_blank" rel="noopener noreferrer" aria-label="Follow @austinpost on Instagram (opens in a new tab)">${icon}<span>@austinpost</span><span aria-hidden="true">↗</span></a></div><div class="social-grid">${edit.map(([name,title,alt,url=instagram,position='50% 50%'],i)=>`<a class="social-card reveal" style="--reveal-delay:${i*45}ms" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${url===instagram?'Explore Austin Post':'View Austin Post post'} on Instagram — ${e(title)} (opens in a new tab)"><div class="social-visual"><img src="/assets/social/${name}.webp" alt="${e(alt)}" style="object-position:${position}" width="1000" height="1000" loading="lazy" decoding="async"><span class="social-badge">${icon}</span><span class="social-visit">${url===instagram?'Explore on Instagram':'View post on Instagram'} <span aria-hidden="true">↗</span></span></div><div class="social-caption"><span>${e(title)}</span><span aria-hidden="true">↗</span></div></a>`).join('')}</div></section>`;
}

function renderHome(){
  const tee=find('standard-tee-3'),puffer=find('sherpa-lined-puffer-jacket-beige'),jeans=find('rodeo-slim-fit-jeans-lt-indigo'),cap=find('ap-snap-back-2'),shirt=find('daybreak-denim-shirt');
  return `<section class="hero charcoal" aria-labelledby="hero-title">
    <div class="hero-copy"><span class="eyebrow">Season two — SS26</span><h1 id="hero-title" class="display"><span>FULL</span><span>THROTTLE</span></h1><p>Austin Post returns with a new chapter.</p>${button('/collections/full-throttle/','View collection')}
      <a class="hero-inset" href="/collections/full-throttle/" aria-label="Explore Full Throttle">${photo('/assets/full-throttle.jpg','Full Throttle campaign: green velour, cowboy boots, and a yellow convertible','',true)}<span>Summer 2026 ${arrow}</span></a>
      <div class="hero-index"><span>SS26</span></div>
    </div><div class="portrait-frame">${photo('/assets/post-portrait.jpg','Post Malone — Austin Post Full Throttle campaign','',true)}<span class="portrait-caption">Austin Post / Post Malone</span></div>
  </section>
  <a class="brand-band" href="/shop/"><span class="display">AUSTIN POST</span><span class="band-cta">Explore the collection ${arrow}</span></a>
  <section id="outerwear" class="outerwear-feature editorial-grid" aria-labelledby="outerwear-title">
    ${imageCard(puffer,0,'bone feature-image')}
    <div class="editorial-copy saddle"><div class="reveal"><h2 id="outerwear-title" class="display">OUTERWEAR</h2>${productCaption(puffer)}${productPrice(puffer)}${button(productURL(puffer),'View product')}<a class="quiet-link" href="/collections/outerwear/">All outerwear ${arrow}</a></div>${imageCard(puffer,puffer.gallery.length-1,'detail-image')}</div>
  </section>
  <section class="shirting-feature denim" aria-labelledby="shirting-title"><div class="editorial-copy"><div class="reveal"><h2 id="shirting-title" class="display">SHIRTING</h2>${productCaption(shirt)}${productPrice(shirt)}${button(productURL(shirt),'View product')}<a class="quiet-link" href="/collections/shirting/">All shirting ${arrow}</a></div></div>${imageCard(shirt,0,'shirt-image')}</section>
  <section class="denim-feature editorial-grid" aria-labelledby="denim-title">${imageCard(jeans,2,'model-image')}<div class="editorial-copy charcoal denim-dark"><div class="reveal"><h2 id="denim-title" class="display">DENIM</h2>${productCaption(jeans)}${productPrice(jeans)}${button(productURL(jeans),'View product')}<a class="quiet-link" href="/collections/denim/">All denim ${arrow}</a></div>${imageCard(jeans,0,'denim-inset bone')}</div></section>
  <section class="everyday-feature editorial-grid" aria-labelledby="everyday-title"><div class="editorial-copy saddle"><div class="reveal"><h2 id="everyday-title" class="display">EVERYDAY</h2>${productCaption(tee)}${productPrice(tee)}${button(productURL(tee),'View product')}<a class="quiet-link" href="/collections/tees/">All tees ${arrow}</a></div></div>${imageCard(tee,0,'bone tee-image')}</section>
  <section class="hat-feature editorial-grid" aria-labelledby="hat-title"><div class="hat-copy bone"><h2 id="hat-title" class="display reveal">THE<br>FINISHING<br>TOUCH</h2><div class="hat-product">${productCaption(cap)}${productPrice(cap)}${button(productURL(cap),'View product')}</div>${imageCard(cap,0,'hat-cutout')}</div>${motionMarkup(`<a class="hat-campaign" href="/collections/accessories/" aria-label="Explore Austin Post accessories">${photo('/assets/hats-campaign.jpg','Post Malone wearing a brown AP Snap Back')}<span>Explore accessories ${arrow}</span></a>`,'/assets/motion/hat-editorial-v2.mp4','AP cap campaign film','hat-motion')}</section>
  <section class="brand-story charcoal"><a class="story-photo" href="/collections/accessories/" aria-label="Discover AP accessories">${photo('/assets/hats-campaign.jpg','AP embroidery and original Austin Post cap craftsmanship')}</a><div><span class="eyebrow">Modern American luxury</span><h2 class="display reveal">GRIT &<br>GRACE.</h2><p>Rooted in the duality of his life, the brand bridges the authenticity of the American West with a refined, modern sensibility.</p>${button('/collections/','Explore the collections')}</div></section>${renderSocial()}${renderTour()}`;
}

function renderCard(p){
  return `<article class="product-card"><a class="card-visual" href="${productURL(p)}" aria-label="${e(p.title)}, ${e(p.color)}, ${money(p.price)}">${photo(p.gallery[0],`${p.title} — ${p.color}`,'card-front')}${p.gallery[1]?photo(p.gallery[1],`${p.title} — alternate view`,'card-alternate'):''}<span class="card-corner" aria-hidden="true">↗</span>${!p.available?'<span class="card-badge">Sold out</span>':p.compareAt>p.price?'<span class="card-badge sale-badge">Sale</span>':''}</a><div class="card-details"><a href="${productURL(p)}"><h3>${e(p.title)}</h3><p>${e(p.color)}</p></a><p class="price">${priceHTML(p)}</p></div></article>`;
}
function catalogToolbar(category,sort){return `<div class="catalog-toolbar"><nav class="category-tabs" aria-label="Product categories"><a href="/shop/" ${category==='all'?'aria-current="page"':''}>All pieces</a>${Object.entries(categories).map(([key,c])=>`<a href="${collectionURL(key)}" ${category===key?'aria-current="page"':''}>${c.title}</a>`).join('')}</nav><label class="sort-control">Sort <select id="sort-select" aria-label="Sort products">${[['featured','Featured'],['price-low','Price: low to high'],['price-high','Price: high to low'],['name','Name: A–Z']].map(([v,t])=>`<option value="${v}" ${sort===v?'selected':''}>${t}</option>`).join('')}</select></label></div>`;}
function renderShop(category='all',sort='featured'){
  const cfg=categories[category], items=filterProducts(products,category,sort), p=cfg?find(cfg.feature):find('leather-trucker-jacket');
  return `<section class="collection-hero ${cfg?.texture||'charcoal'}"><div class="collection-heading"><span class="eyebrow">${cfg?'The collection — '+cfg.index:'The Austin Post edit'}</span><h1 class="display">${cfg?cfg.title.toUpperCase():'SHOP<br>THE EDIT.'}</h1><p>${cfg?e(p.description.split('. ')[0]+'.'):'Denim, shirting, and outerwear. Made to be lived in, worn hard.'}</p><span class="collection-count">${items.length} ${items.length===1?'piece':'pieces'} / Austin Post</span></div><a class="collection-feature" href="${productURL(p)}" aria-label="Explore ${e(p.title)}">${photo(p.gallery[Math.min(2,p.gallery.length-1)],`${p.title} — ${p.color}`,'',true)}<span>${e(p.title)} ${arrow}</span></a></section>${catalogToolbar(category,sort)}<section class="catalog-section"><div class="catalog-heading"><span class="eyebrow">${cfg?.title||'Selected pieces'}</span><span>${String(items.length).padStart(2,'0')} pieces</span></div><div class="product-grid">${items.map(renderCard).join('')}</div></section><section class="collection-end saddle"><h2 class="display">KEEP<br>EXPLORING.</h2><div><p>Find your next piece in the collection.</p>${button('/collections/','View all collections')}</div></section>`;
}
function renderCollections(){return `<section class="collections-intro charcoal"><span class="eyebrow">Austin Post</span><h1 class="display">THE<br>COLLECTIONS.</h1><p>Denim, fleece, shirting, and outerwear built with integrity and balance, intended to endure.</p></section><section class="collection-cards">${Object.entries(categories).map(([key,c])=>{const p=find(c.feature);return `<a class="collection-card ${c.texture}" href="${collectionURL(key)}">${label(c.index,'Explore')}<div class="collection-card-image">${photo(p.gallery[key==='denim'?2:0],`${p.title} — ${p.color}`)}</div><h2 class="display">${c.title.toUpperCase()}</h2><span class="collection-card-link">${filterProducts(products,key).length} pieces ${arrow}</span></a>`;}).join('')}</section><section class="campaign-collection charcoal"><div><span class="eyebrow">SS26</span><h2 class="display">FULL<br>THROTTLE.</h2><p>Austin Post returns with a new chapter.</p>${button('/collections/full-throttle/','Explore the summer edit')}</div><div>${photo('/assets/full-throttle.jpg','Austin Post Full Throttle campaign')}</div></section>`;}
function renderCampaign(){const selected=products.filter(p=>['velour-track-jacket-2','bowling-shirt-1','chrome-cowboy-tee','range-straight-cut-3','ap-snap-back-2'].includes(p.handle));return `<section class="campaign-page charcoal"><div class="campaign-heading"><span class="eyebrow">Season two — Summer 2026</span><h1 class="display">FULL<br>THROTTLE.</h1><p>Austin Post returns with a new chapter.</p><p class="campaign-copy">Shot in Los Angeles with Austin Post aka Post Malone, the Summer 2026 Campaign is inspired by the feeling of the last day of school in the 1970s — when summer stretched endlessly ahead and anything felt possible.</p><a class="text-link" href="#summer-edit">Explore the summer edit ${arrow}</a></div><div class="campaign-page-photo">${photo('/assets/full-throttle.jpg','Full Throttle campaign — green velour and cowboy boots','',true)}</div></section><section id="summer-edit" class="catalog-section"><div class="catalog-heading"><h2 class="display">THE SUMMER EDIT</h2><a href="/shop/" class="text-link">All pieces ${arrow}</a></div><div class="product-grid">${selected.map(renderCard).join('')}</div></section>`;}

function renderProduct(p){
  currentProduct=p;galleryIndex=0;selectedVariant=null;
  const related=products.filter(item=>item.handle!==p.handle&&item.category===p.category);
  const recommendations=[...related,...products.filter(item=>item.handle!==p.handle&&item.category!==p.category)].slice(0,4);
  const category=categories[p.category];
  const colorways=products.filter(other=>other.title===p.title);
  const colorLinks=colorways.length>1?`<div class="colorways" aria-label="Available colorways">${colorways.map(other=>`<a href="${productURL(other)}" ${other.handle===p.handle?'aria-current="page"':''}>${e(other.color)}</a>`).join('')}</div>`:'';
  const galleryPhoto = `<button class="main-product-image" data-action="zoom" aria-label="Enlarge ${e(p.title)} image">${photo(p.gallery[0],`${p.title} — ${p.color}`,'',true)}<span class="zoom-label">Explore the details +</span></button>`;
  const mainGallery = p.handle==='sherpa-lined-puffer-jacket-beige'?motionMarkup(galleryPhoto,'/assets/motion/puffer-lifestyle.mp4','Outpost Sherpa Puffer film','product-motion'):galleryPhoto;
  return `<div class="product-breadcrumb"><a href="/shop/">Shop</a><span>/</span><a href="${collectionURL(p.category)}">${category.title}</a><span>/</span><span>${e(p.title)}</span></div><section class="product-layout"><div class="product-gallery">${mainGallery}<div class="gallery-controls"><button data-action="gallery-prev" aria-label="Previous product image">←</button><span id="gallery-count">01 / ${String(p.gallery.length).padStart(2,'0')}</span><button data-action="gallery-next" aria-label="Next product image">→</button></div><div class="thumbnail-list" aria-label="Product gallery">${p.gallery.map((src,i)=>`<button data-action="gallery" data-index="${i}" class="thumbnail ${i===0?'active':''}" aria-label="View image ${i+1} of ${p.gallery.length}" aria-pressed="${i===0}">${photo(src,`${p.title} — view ${i+1}`)}</button>`).join('')}</div></div><div class="product-information"><span class="eyebrow">${category.title} / Austin Post</span><h1 class="display">${e(p.title).toUpperCase()}</h1><div class="product-price-row">${productPrice(p)}<span>USD</span></div><div class="color-line"><span>Color</span><span>${e(p.color)}</span></div>${colorLinks}<p class="product-description">${e(p.description)}</p><div class="size-heading"><span>Select size</span><span id="size-choice" aria-live="polite"></span></div><div class="size-options">${p.variants.map((v,i)=>`<button data-action="size" data-index="${i}" aria-pressed="false" ${!v.available?'disabled':''} aria-label="${e(v.size)}${v.available?'':' — sold out'}">${e(v.size||'One Size')}</button>`).join('')}</div><p id="size-message" class="size-message" aria-live="polite">${p.available?'Choose an available size to add this piece.':'This color is currently sold out.'}</p><button id="add-bag" class="button add-to-bag" data-action="add" ${!p.available?'disabled':''}><span>${p.available?'Add to bag':'Sold out'}</span><span aria-hidden="true">+</span></button><a class="source-product" href="${e(p.sourceUrl)}" target="_blank" rel="noopener">View original product on Austin Post ${arrow}</a><details class="product-detail" open><summary>Product details <span>+</span></summary><p>${e(p.description)}</p></details><details class="product-detail"><summary>Shipping & returns <span>+</span></summary><p>Free domestic shipping on orders of $300 and above. Please allow 2–3 business days for order processing. Returns are accepted within 14 days of delivery; items must be unworn, unwashed, and have original tags attached. A $7 return shipping fee applies.</p><p class="prototype-note">This is a browsing concept. Purchases and fulfilment are handled by the original Austin Post store.</p></details></div></section><section class="product-editorial ${category.texture}"><div><span class="eyebrow">The details / ${e(p.color)}</span><h2 class="display">MADE TO<br>BE LIVED IN.</h2><p>${e(p.description.split('. ')[0]+'.')}</p></div><div class="product-editorial-photo ${p.handle==='ap-snap-back-2'?'hat-detail':''}">${photo(p.gallery[p.gallery.length-1],`${p.title} — close-up or alternate product view`)}</div></section><section class="catalog-section related-section"><div class="catalog-heading"><h2 class="display">COMPLETE THE LOOK</h2><a class="text-link" href="/shop/">Shop the edit ${arrow}</a></div><div class="product-grid">${recommendations.map(renderCard).join('')}</div></section>`;
}

function render(){
  disposeMotion();disposeTour();
  closeMenu();document.querySelector('#bag-dialog').close();document.querySelector('#image-dialog').close();currentProduct=null;
  const path=location.pathname.replace(/\/+$/,'')||'/';let html;
  if(path==='/') {html=renderHome();document.title='Austin Post — Full Throttle';}
  else if(path==='/shop') {html=renderShop();document.title='Shop the Edit — Austin Post';}
  else if(path==='/collections') {html=renderCollections();document.title='The Collections — Austin Post';}
  else if(path==='/collections/full-throttle') {html=renderCampaign();document.title='Full Throttle — Austin Post';}
  else if(path.startsWith('/collections/')&&categories[path.split('/')[2]]) {const key=path.split('/')[2];html=renderShop(key);document.title=categories[key].title+' — Austin Post';}
  else if(path.startsWith('/products/')&&find(path.split('/')[2])) {const p=find(path.split('/')[2]);html=renderProduct(p);document.title=p.title+' — Austin Post';}
  else {html=`<section class="not-found charcoal"><h1 class="display">BACK TO<br>THE EDIT.</h1>${button('/shop/','Explore all pieces')}</section>`;document.title='Explore Austin Post';}
  main.innerHTML=html;document.body.dataset.page=currentProduct?'product':path==='/'?'home':'collection';
  document.querySelectorAll('.desktop-nav a').forEach(a=>{if(path.startsWith(a.getAttribute('href').replace(/\/$/,'')))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  setupReveal();setupMotion();setupTour(main);updateBagCount();fitHeadlines();
  if(location.hash) requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView());
}
let revealObserver;
function fitHeadlines(){requestAnimationFrame(()=>{for(const heading of document.querySelectorAll('.display')){heading.style.fontSize='';if(heading.scrollWidth>heading.clientWidth+1){const size=parseFloat(getComputedStyle(heading).fontSize);heading.style.fontSize=`${Math.floor(size*heading.clientWidth/heading.scrollWidth*.98)}px`;}}});}
document.fonts.ready.then(fitHeadlines);
addEventListener('resize',fitHeadlines,{passive:true});
function setupReveal(){
  revealObserver?.disconnect();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  if(document.body.dataset.page==='home'){
    // Reveal the editorial details once, rather than moving entire sections.
    main.querySelectorAll('.section-label,.detail-image,.denim-inset,.hat-product,.brand-story .eyebrow,.brand-story p,.brand-story .button,.story-photo,.brand-band .band-cta').forEach(el=>el.classList.add('reveal'));
    main.querySelectorAll('.editorial-copy>.reveal,.hat-product,.brand-story p').forEach(el=>el.style.setProperty('--reveal-delay','80ms'));
    main.querySelectorAll('.detail-image,.denim-inset,.brand-story .button').forEach(el=>el.style.setProperty('--reveal-delay','140ms'));
  }
  revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
  }),{threshold:.08,rootMargin:'0px 0px -24px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('will-reveal');revealObserver.observe(el);});
}
function closeMenu(){document.querySelector('#mobile-menu').hidden=true;const btn=document.querySelector('.menu-trigger');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Open navigation');}
function navigate(href){history.pushState({},'',href);render();scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
function toast(text){const t=document.querySelector('#toast');t.textContent=text;t.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('visible'),2600);}
function saveBag(){try{localStorage.setItem('ap-concept-bag',JSON.stringify(bag));}catch{}updateBagCount();}
function updateBagCount(){document.querySelector('#bag-count').textContent=String(bag.reduce((sum,item)=>sum+item.quantity,0)).padStart(2,'0');}
function showBag(){const box=document.querySelector('#bag-content');box.innerHTML=bag.length?`${bag.map(item=>{const p=find(item.handle);if(!p)return'';return `<article class="bag-item"><a href="${productURL(p)}">${photo(p.gallery[0],p.title)}</a><div><a href="${productURL(p)}">${e(p.title)}</a><p>${e(p.color)} / ${e(item.size)}</p><p>${money(p.variants.find(v=>v.id===item.variantId)?.price??p.price)}</p><div class="quantity"><button data-action="quantity" data-key="${e(item.key)}" data-delta="-1" aria-label="Reduce ${e(p.title)} quantity">−</button><span>${item.quantity}</span><button data-action="quantity" data-key="${e(item.key)}" data-delta="1" aria-label="Increase ${e(p.title)} quantity">+</button><button class="remove-item" data-action="remove" data-key="${e(item.key)}">Remove</button></div></div></article>`;}).join('')}<div class="bag-subtotal"><span>Subtotal</span><span>${money(bagTotal(bag,products))}</span></div><p class="prototype-note">A preview bag for this design concept. No orders or payments are submitted.</p>${button('/shop/','Continue exploring')}`:`<div class="empty-bag"><p>Your next favorite is out there.</p>${button('/shop/','Explore the edit')}</div>`;const dialog=document.querySelector('#bag-dialog');if(!dialog.open)dialog.showModal();}
function setGallery(index){if(!currentProduct)return;galleryIndex=(index+currentProduct.gallery.length)%currentProduct.gallery.length;setMotionEnabled(document.querySelector('.product-motion'),galleryIndex===0);const src=currentProduct.gallery[galleryIndex];const image=document.querySelector('.main-product-image img');image.src=src;image.alt=`${currentProduct.title} — view ${galleryIndex+1}`;document.querySelector('#gallery-count').textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(currentProduct.gallery.length).padStart(2,'0')}`;document.querySelectorAll('.thumbnail').forEach((b,i)=>{b.classList.toggle('active',i===galleryIndex);b.setAttribute('aria-pressed',String(i===galleryIndex));});const zoom=document.querySelector('#lightbox-image');zoom.src=src;zoom.alt=image.alt;document.querySelector('#lightbox-count').textContent=`${galleryIndex+1} / ${currentProduct.gallery.length}`;}
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(link&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0&&link.target!=='_blank'){
    const url=new URL(link.href,location.href);
    if(url.origin===location.origin){event.preventDefault();if(url.pathname===location.pathname&&url.hash){document.querySelector(url.hash)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}navigate(url.pathname+url.hash);return;}
  }
  const control=event.target.closest('[data-action]');if(!control)return;const action=control.dataset.action;
  if(action==='menu'){const menu=document.querySelector('#mobile-menu');menu.hidden=!menu.hidden;control.setAttribute('aria-expanded',String(!menu.hidden));control.setAttribute('aria-label',menu.hidden?'Open navigation':'Close navigation');}
  if(action==='bag')showBag();
  if(action==='close-bag')document.querySelector('#bag-dialog').close();
  if(action==='close-image')document.querySelector('#image-dialog').close();
  if(action==='top')scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  if(action==='gallery')setGallery(Number(control.dataset.index));
  if(action==='gallery-prev')setGallery(galleryIndex-1);
  if(action==='gallery-next')setGallery(galleryIndex+1);
  if(action==='zoom'){pauseMotion();setGallery(galleryIndex);document.querySelector('#image-dialog').showModal();}
  if(action==='size'&&currentProduct){selectedVariant=currentProduct.variants[Number(control.dataset.index)];document.querySelectorAll('.size-options button').forEach(b=>b.setAttribute('aria-pressed',String(b===control)));document.querySelector('#size-choice').textContent=selectedVariant.size;document.querySelector('#size-message').textContent=selectedVariant.available?'Selected: '+selectedVariant.size:'This size is currently sold out.';}
  if(action==='add'&&currentProduct){if(!selectedVariant){document.querySelector('#size-message').textContent='Please select an available size first.';document.querySelector('.size-options button:not(:disabled)')?.focus();toast('Select your size');return;}bag=addToBag(bag,currentProduct,selectedVariant);saveBag();toast(`${currentProduct.title} added to your preview bag`);showBag();}
  if(action==='remove'){bag=bag.filter(item=>item.key!==control.dataset.key);saveBag();showBag();}
  if(action==='quantity'){bag=bag.map(item=>item.key===control.dataset.key?{...item,quantity:item.quantity+Number(control.dataset.delta)}:item).filter(item=>item.quantity>0);saveBag();showBag();}
});
document.addEventListener('change',event=>{if(event.target.id==='sort-select'){const category=location.pathname.split('/')[2]||'all';main.innerHTML=renderShop(categories[category]?category:'all',event.target.value);setupReveal();fitHeadlines();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();if(document.querySelector('#image-dialog').open&&event.key==='ArrowLeft')setGallery(galleryIndex-1);if(document.querySelector('#image-dialog').open&&event.key==='ArrowRight')setGallery(galleryIndex+1);});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
addEventListener('popstate',()=>{render();scrollTo(0,0);});
let scrolling=false;
addEventListener('scroll',()=>{if(scrolling)return;scrolling=true;requestAnimationFrame(()=>{document.querySelector('.site-header').classList.toggle('scrolled',scrollY>24);const portrait=document.querySelector('.portrait-frame');if(portrait&&!matchMedia('(prefers-reduced-motion: reduce)').matches)portrait.style.setProperty('--drift',`${Math.min(scrollY*.014,8)}px`);scrolling=false;});},{passive:true});
try{const response=await fetch('/catalog.json');if(!response.ok)throw Error('Catalog unavailable');catalog=await response.json();products=catalog.products;bag=bag.filter(item=>products.some(p=>p.handle===item.handle));render();}catch(error){main.innerHTML=`<section class="not-found charcoal"><h1 class="display">ONE MOMENT.</h1><p>The collection could not load. Refresh the page to try again.</p><button class="button" onclick="location.reload()">Reload collection ↗</button></section>`;console.error(error);}

document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseMotion();});
