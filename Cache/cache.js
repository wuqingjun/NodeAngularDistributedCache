module.exports = {
    Cache : {
    Version: '1.0',
    objects: [],
    push: function(k, v) {
    return this.objects.push({ k: v });
    }
},

    testonly: function () {
    
    }
}

