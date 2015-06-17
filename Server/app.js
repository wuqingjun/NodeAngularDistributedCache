console.log('Hello Server');

var cache = require('./cache.js');
console.log(cache.testonly);
console.log(cache.Cache);
cache.Cache.push('k', 'serverV');
console.log(cache.Cache.objects);