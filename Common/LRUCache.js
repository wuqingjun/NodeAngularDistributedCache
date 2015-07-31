var Node = function(k, v) {
    this.key = k;
    this.value = v;
    this.prev = null;
    this.next = null;
};


var Dll = function() {
    this.head = new Node(null, null);
    this.tail = new Node(null, null);

    this.head.next = this.tail;
    this.tail.prev = this.head;
};

Dll.prototype.append = function(n) {
    this.tail.prev.next = n;
    n.prev = this.tail.prev;
    n.next = this.tail;
    this.tail.prev = n;
};

Dll.prototype.remove = function(n) {
    n.prev.next = n.next;
    n.next.prev = n.prev;
};


var LRUCache = function(capacity) {
    this.Objectes = new Array();
    this.Size = capacity;
    this.Count = 0;
    this.Executing = false;
    this.dll = new Dll();
};

LRUCache.prototype.get = function (key) {
    this.Executing = true;
    if (key in this.Objectes) {
        this.dll.remove(this.Objectes[key]);
        this.dll.append(this.Objectes[key]);
    }
    this.Executing = false;
    return this.Objectes[key].value;
};

LRUCache.prototype.push = function (key, value) {
    this.Executing = true;
    if (key in this.Objectes) {
        this.Objectes[key].value = value;
        this.dll.remove(this.Objectes[key]);
        this.dll.append(this.Objectes[key]);
    } else {
        var p = new Node(key, value);
        if (this.Count === this.Size) {
            delete this.Objectes[this.dll.head.next.key];
            this.dll.remove(this.dll.head.next);
            this.dll.append(p);
            this.Objectes[key] = p;
        } else {
            this.Objectes[key] = p;
            this.dll.append(p);
            ++this.Count;
        }
    }
    this.Executing = false;
};

LRUCache.prototype.clear = function () {
    this.Executing = true;
    while (this.Count > 0) {
        delete this.Objectes[this.dll.head.next.key];
        this.dll.remove(this.dll.head.next);
        --this.Count;
    }
    this.Executing = false;
};


module.exports = LRUCache;