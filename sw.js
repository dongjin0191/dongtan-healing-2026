// 바로가기 설치용 서비스 워커: 항상 최신 내용을 네트워크에서 가져옵니다.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(function () { return new Response('오프라인입니다. 인터넷에 연결한 뒤 다시 열어주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }));
});
