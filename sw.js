/* Arbeitszeit – Offline-Unterstützung.
   Strategie: immer zuerst das Netz (damit Updates sofort ankommen), bei fehlendem Netz die zuletzt geladene Fassung.
   Die GitHub-Daten selbst laufen nicht hierüber – sie liegen ohnehin im Browser und werden später nachgespeichert. */
const CACHE='arbeitszeit-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request, u=new URL(req.url);
  if(req.method!=='GET'||u.origin!==self.location.origin)return;          // GitHub-API usw. nicht anfassen
  const key=req.mode==='navigate'?new URL('./index.html',self.registration.scope).href:u.origin+u.pathname;
  e.respondWith((async()=>{
    const net=fetch(req,{cache:'no-store'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(key,cp))}return r});
    try{return await Promise.race([net,new Promise((_,rej)=>setTimeout(()=>rej(new Error('langsam')),6000))])}
    catch(err){const hit=await caches.match(key);return hit||net}
  })());
});
