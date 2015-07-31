var LRUCache = require('../Common/lrucache.js');

var cache = new LRUCache(10);

cache.push('k1', 'v1');
cache.push('k2', 'v2');
cache.push('k2', 'v2');
cache.push('k3', 'v3');
cache.push('k4', 'v4');
cache.push('k5', 'v5');
cache.push('k6', 'v6');
cache.push('k7', 'v7');
cache.push('k8', 'v8');
cache.push('k9', 'v9');
cache.push('k10', 'v10');
cache.push('k11', 'v11');
cache.push('k12', 'v12');


var v1 = cache.get('k1');

var v11 = cache.get('k11');
var v13 = cache.get('k13');
cache.clear();
