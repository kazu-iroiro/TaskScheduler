var CACHE_NAME = "sw-cache-v2-1";

var urlsToCache = [
    "index.html",
    "favicon.ico",
    "apple-touch-icon.png",
    "jquery-3.5.1.min.js",
    "kuromoji.js",
    "main.js",
    "pwacompat.min.js",
    "manifest.json",
    "style.css",
    "images/about.png",
    "images/check.png",
    "images/floppy.png",
    "images/home.png",
    "images/howto.png",
    "images/install.png",
    "images/license.png",
    "images/mic_icon.png",
    "images/setting.png",
    "dict/base.dat.gz",
    "dict/cc.dat.gz",
    "dict/check.dat.gz",
    "dict/tid_map.dat.gz",
    "dict/tid_pos.dat.gz",
    "dict/tid.dat.gz",
    "dict/unk_char.dat.gz",
    "dict/unk_compat.dat.gz",
    "dict/unk_invoke.dat.gz",
    "dict/unk_map.dat.gz",
    "dict/unk_pos.dat.gz",
    "dict/unk.dat.gz",
    "BIZ_UDGothic/BIZUDGothic-Bold.ttf"
];

// 残したいキャッシュのバージョンをこの配列に入れる
// 基本的に現行の1つだけでよい。他は削除される。
const CACHE_KEYS = [
    CACHE_NAME
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME) // 上記で指定しているキャッシュ名
            .then(
                function (cache) {
                    return cache.addAll(urlsToCache); // 指定したリソースをキャッシュへ追加
                    // 1つでも失敗したらService Workerのインストールはスキップされる
                })
    );
});

//新しいバージョンのServiceWorkerが有効化されたとき
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => {
                    return !CACHE_KEYS.includes(key);
                }).map(key => {
                    // 不要なキャッシュを削除
                    return caches.delete(key);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    var online = navigator.onLine;

    if (online) {
        console.log("ONLINE");
        //このパターンの処理では、Responseだけクローンすれば問題ない
        //cloneEventRequest = event.request.clone();
        event.respondWith(
            caches.match(event.request)
                .then(
                    function (response) {
                        if (response) {
                            //オンラインでもローカルにキャッシュでリソースがあればそれを返す
                            //ここを無効にすればオンラインのときは常にオンラインリソースを取りに行き、その最新版をキャッシュにPUTする
                            return response;
                        }
                        //request streem 1
                        return fetch(event.request)
                            .then(function (response) {
                                //ローカルキャッシュになかったからネットワークから落とす
                                //ネットワークから落とせてればここでリソースが返される

                                // Responseはストリームなのでキャッシュで使用してしまうと、ブラウザの表示で不具合が起こる(っぽい)ので、複製したものを使う
                                cloneResponse = response.clone();

                                if (response) {
                                    if (response || response.status == 200) {
                                        console.log("正常にリソースを取得");
                                        caches.open(CACHE_NAME)
                                            .then(function (cache) {
                                                console.log("キャッシュへ保存");
                                                //初回表示でエラー起きているが致命的でないので保留
                                                cache.put(event.request, cloneResponse)
                                                    .then(function () {
                                                        console.log("保存完了");
                                                    });
                                            });
                                    } else {
                                        return event.respondWith(new Response('200以外のエラーをハンドリングしたりできる'));
                                    }
                                    return response;
                                }
                            }).catch(function (error) {
                                return console.log(error);
                            });
                    })
        );
    } else {
        console.log("OFFLINE");
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                    // キャッシュがあったのでそのレスポンスを返す
                    if (response) {
                        return response;
                    }
                    //オフラインでキャッシュもなかったパターン
                    return caches.match("offline.html")
                        .then(function (responseNodata) {
                            return responseNodata;
                        });
                }
                )
        );
    }
});