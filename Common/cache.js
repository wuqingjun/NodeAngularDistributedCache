function Cache() {
    this.Objectes = new Array(10);
    this.Size = 10;
    this.Executing = false;
}

Cache.prototype.push = function (k, v) {
    this.Executing = true;
    this.Objectes[k] = v;
    this.Executing = false;
}

Cache.prototype.get = function (k) {
    return this.Objectes[k];
};

Cache.prototype.clear = function () {
    this.Executing = true;
    while (this.Objects.length > this.Size) {
        delete this.Objects[0];
    }
    this.Executing = false;
};

Cache.default = null;

module.exports = Cache;