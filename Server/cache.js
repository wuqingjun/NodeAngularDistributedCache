module.exports = {
    Cache : {
        Version: '1.0',
        objects: [],
        executing: false,
        Size: 10,
        push: function (k, v) {
            this.executing = true;
            this.objects[k] = v;
            this.executing = false;
        },
        get: function (k) {
            return this.objects[k];
        },
        clear: function () {
            this.executing = true;
            while (cache.Cache.objects.length > this.Size) {
                delete cache.Cache.objects[0];
            }
            this.executing = false;
        }

    }
}
