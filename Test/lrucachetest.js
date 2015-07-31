var LRUCache = require('../Common/lrucache.js');

var cache = new LRUCache(10);

cache.set('k1', 'v1');
cache.set('k2', 'v2');
cache.set('k2', 'v2');
cache.set('k3', 'v3');
cache.set('k4', 'v4');
cache.set('k5', 'v5');
cache.set('k6', 'v6');
cache.set('k7', 'v7');
cache.set('k8', 'v8');
cache.set('k9', 'v9');
cache.set('k10', 'v10');
cache.set('k11', 'v11');
cache.set('k12', 'v12');


var v1 = cache.get('k1');