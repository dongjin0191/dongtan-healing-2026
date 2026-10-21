// 바로가기 설치용 최소 서비스 워커: 항상 최신 내용을 네트워크에서 가져옵니다.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () {});
