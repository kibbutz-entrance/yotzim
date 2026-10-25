const C='yotzim-v4',F=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
const HOME=new URL('index.html',self.registration.scope).href;
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('yotzim-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function navigation(request){
  const cache=await caches.open(C),controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),3500);
  try{
    const response=await fetch(request,{cache:'no-cache',signal:controller.signal});
    if(!response.ok)throw new Error('Navigation failed');
    await cache.put(HOME,response.clone());
    return response;
  }catch(error){
    const saved=await cache.match(HOME);
    if(saved)return saved;
    throw error;
  }finally{clearTimeout(timeout)}
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  if(e.request.mode==='navigate'){e.respondWith(navigation(e.request));return}
  e.respondWith(caches.open(C).then(async c=>(await c.match(e.request,{ignoreSearch:true}))||fetch(e.request)));
});
