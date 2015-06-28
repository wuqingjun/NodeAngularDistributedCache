console.log('Hello world');

var cache = require('./cache.js');
//cache.Cache.push('k1', 'v1');
console.log(cache.testonly);
console.log(cache.Cache);
cache.Cache.push('k', 'v');
console.log(cache.Cache.get('k'));
