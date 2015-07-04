console.log('Hello world');
var Cache = require('./cache.js');
var globalCache = new Cache();
globalCache.push("k1", 'v1');
globalCache.push("k2", 'v2');

var itemList = [];
for (var k in globalCache.Objectes) {
    console.log(k);
    console.log(globalCache.Objectes[k]);
    itemList.push({key: k, value: globalCache.Objectes[k]});
}
console.log(itemList);