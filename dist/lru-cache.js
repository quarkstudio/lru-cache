// Generated by CoffeeScript 1.12.6
(function() {
  var DoubleLinkedList, LRUCache, createNode;

  createNode = function(data, pre, next) {
    return {
      data: data,
      pre: pre,
      next: next
    };
  };

  DoubleLinkedList = (function() {
    function DoubleLinkedList() {
      this.headNode = this.tailNode = null;
    }

    DoubleLinkedList.prototype.remove = function(node) {
      if (node.pre) {
        node.pre.next = node.next;
      } else {
        this.headNode = node.next;
      }
      if (node.next) {
        return node.next.pre = node.pre;
      } else {
        return this.tailNode = node.pre;
      }
    };

    DoubleLinkedList.prototype.insertBeginning = function(node) {
      if (this.headNode) {
        node.next = this.headNode;
        this.headNode.pre = node;
        return this.headNode = node;
      } else {
        return this.headNode = this.tailNode = node;
      }
    };

    DoubleLinkedList.prototype.moveToHead = function(node) {
      this.remove(node);
      return this.insertBeginning(node);
    };

    DoubleLinkedList.prototype.clear = function() {
      return this.headNode = this.tailNode = null;
    };

    return DoubleLinkedList;

  })();

  LRUCache = (function() {
    function LRUCache(capacity, maxAge) {
      this.capacity = capacity != null ? capacity : 10;
      this.maxAge = maxAge != null ? maxAge : void 0;
      this._linkList = new DoubleLinkedList();
      this.reset();
    }

    LRUCache.prototype.logStats = function() {
      return console.log("lru stats", {
        capacity: this.capacity,
        size: this.size,
        count: this.keys().length,
        percent: Math.round((this.size / this.capacity) * 100),
        keys: this.keys()
      });
    };

    LRUCache.prototype.keys = function() {
      return Object.keys(this._hash);
    };

    LRUCache.prototype.values = function() {
      var values;
      values = this.keys().map((function(_this) {
        return function(key) {
          return _this.get(key);
        };
      })(this));
      return values.filter(function(v) {
        return v !== void 0;
      });
    };

    LRUCache.prototype.remove = function(key) {
      var node, size;
      node = this._hash[key];
      if (!node) {
        throw "no node exists for key " + key;
      }
      console.log("removing", key, node.data.size);
      this._linkList.remove(node);
      delete this._hash[key];
      if (node.data.onDispose) {
        node.data.onDispose.call(this, node.data.key, node.data.value);
      }
      if ((size = node.data.size)) {
        this.size -= size;
        return size;
      } else {
        return 0;
      }
    };

    LRUCache.prototype.reset = function() {
      this._hash = {};
      this.size = 0;
      return this._linkList.clear();
    };

    LRUCache.prototype.cleanup = function(size) {
      var freed, target;
      console.log("cleanup", size);
      freed = 0;
      target = this.size - size;
      while (this.size > target) {
        freed += this.remove(this._linkList.tailNode.data.key);
      }
      console.log("freed", freed);
      return freed;
    };

    LRUCache.prototype.set = function(key, value, size, onDispose) {
      var diff, freed, newSize, node;
      if (size == null) {
        size = void 0;
      }
      if (size >= this.capacity) {
        throw "size greater than capacity";
      }
      node = this._hash[key];
      if (size) {
        newSize = (node && node.data.size) ? this.size + size - node.data.size : this.size + size;
        diff = newSize - this.capacity;
        if (diff > 0) {
          freed = this.cleanup(diff);
          newSize -= freed;
        }
      }
      if (node) {
        node.data.value = value;
        node.data.size = size;
        node.data.onDispose = onDispose;
        this._refreshNode(node);
      } else {
        node = createNode({
          key: key,
          value: value,
          onDispose: onDispose,
          size: size
        });
        if (this.maxAge) {
          node.data.lastVisitTime = Date.now();
        }
        this._linkList.insertBeginning(node);
        this._hash[key] = node;
      }
      if (newSize) {
        this.size = newSize;
      }
    };

    LRUCache.prototype.get = function(key) {
      var node;
      node = this._hash[key];
      if (!node) {
        return void 0;
      }
      if (this.maxAge && this._isExpiredNode(node)) {
        this.remove(key);
        return void 0;
      }
      this._refreshNode(node);
      return node.data.value;
    };

    LRUCache.prototype._refreshNode = function(node) {
      node.data.lastVisitTime = Date.now();
      return this._linkList.moveToHead(node);
    };

    LRUCache.prototype._isExpiredNode = function(node) {
      return Date.now() - node.data.lastVisitTime > this.maxAge;
    };

    LRUCache.prototype.has = function(key) {
      return this._hash[key] != null;
    };

    return LRUCache;

  })();

  if (typeof module === 'object' && module.exports) {
    module.exports = LRUCache;
  } else {
    this.LRUCache = LRUCache;
  }

}).call(this);
