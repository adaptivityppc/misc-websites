export const categories = {
  outerwear: {title:'Outerwear', texture:'saddle', index:'01', intro:'Outpost Sherpa Puffer', feature:'sherpa-lined-puffer-jacket-beige'},
  denim: {title:'Denim', texture:'denim', index:'02', intro:'Highland Slim Cut', feature:'rodeo-slim-fit-jeans-lt-indigo'},
  shirting: {title:'Shirting', texture:'denim', index:'03', intro:'Daybreak Denim Shirt', feature:'daybreak-denim-shirt'},
  tees: {title:'Tees', texture:'saddle', index:'04', intro:'Standard Tee', feature:'standard-tee-3'},
  accessories: {title:'Accessories', texture:'charcoal', index:'05', intro:'AP Snap Back', feature:'ap-snap-back-2'}
};
export function escapeHTML(value='') { return String(value).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
export function money(value) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value); }
export function filterProducts(products, category='all', sort='featured') {
  const result=products.filter(p=>category==='all'||p.category===category);
  if(sort==='price-low') result.sort((a,b)=>a.price-b.price);
  if(sort==='price-high') result.sort((a,b)=>b.price-a.price);
  if(sort==='name') result.sort((a,b)=>a.title.localeCompare(b.title));
  return result;
}
export function priceHTML(product) {return `<span class="current-price">${money(product.price)}</span>${product.compareAt>product.price?` <s>${money(product.compareAt)}</s>`:''}`;}
export function addToBag(bag, product, variant) {
  if(!variant?.available) return bag;
  const key=`${product.id}:${variant.id}`;
  const existing=bag.find(item=>item.key===key);
  return existing?bag.map(item=>item.key===key?{...item,quantity:item.quantity+1}:item):[...bag,{key,handle:product.handle,variantId:variant.id,size:variant.size,quantity:1}];
}
export function bagTotal(bag,products) {return bag.reduce((sum,item)=>{const p=products.find(p=>p.handle===item.handle);const v=p?.variants.find(v=>v.id===item.variantId);return sum+(v?.price??p?.price??0)*item.quantity;},0);}
