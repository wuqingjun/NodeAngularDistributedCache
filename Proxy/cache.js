function Cache() {
    this.Objectes = new Array(10);
    this.Size = 10;
    this.Executing = false;
}

Cache.prototype.push = function (k, v){
    this.Executing = true;
    this.Objectes[k] = v;
    this.Executing = false;    
}

Cache.prototype.get = function(k) {
    return this.Objectes[k];
};

Cache.prototype.clear = function() {
    this.Executing = true;
    while (cache.Cache.objects.length > this.Size) {
        delete cache.Cache.objects[0];
    }
    this.Executing = false;
};

module.exports = Cache;