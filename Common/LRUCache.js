// Double Linked List Node
var Node = function(k, v) {
    this.key = k;
    this.value = v;
    this.prev = null;
    this.next = null;
};

// Double Linked List constructor
var Dll = function() {
    this.head = new Node(null, null);
    this.tail = new Node(null, null);

    this.head.next = this.tail;
    this.tail.prev = this.head;
};

// Appending a node to the tail.
Dll.prototype.append = function(n) {
    this.tail.prev.next = n;
    n.prev = this.tail.prev;
    n.next = this.tail;
    this.tail.prev = n;
};

// remove a node from the list.
Dll.prototype.remove = function(n) {
    n.prev.next = n.next;
    n.next.prev = n.prev;
}

// construting a LRU Cache. Initial size is set to capacity.
// a dictionary is also constructed. The value field of the dictionary is pointing the address(reference) 
// of the corresponding node in the double linked list.
var LRUCache = function(capacity) {
    this.Objectes = new Array();
    this.Size = capacity;
    this.Count = 0;
    this.Executing = false;
    this.dll = new Dll();
};

// return the value given a key, and also move the node to the tail.
LRUCache.prototype.get = function (key) {
    var value = undefined;
    if (key in this.Objectes) {
        this.dll.remove(this.Objectes[key]);
        this.dll.append(this.Objectes[key]);
        value = this.Objectes[key].value;
    }
    return value;
};

// push a (key, value) to the cache. A node will be added to the tail of the dll, 
// and (key, address of the node) will also be added into the dictionary.
LRUCache.prototype.push = function (key, value) {
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
};

// cleaning the cache
LRUCache.prototype.clear = function () {
    while (this.Count > 0) {
        delete this.Objectes[this.dll.head.next.key];
        this.dll.remove(this.dll.head.next);
        --this.Count;
    }
};


module.exports = LRUCache;
