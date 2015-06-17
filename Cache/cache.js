module.exports = {
    Cache : {
    Version: '1.0',
    objects: [],
    push: function(k, v) {
        this.objects[k] = v;
        },
    get:function(k) {
        return this.objects[k];
    }
}
}

