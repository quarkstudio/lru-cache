createNode = (data, pre, next) -> {data, pre, next}

class DoubleLinkedList
  constructor:  ->
    @headNode = @tailNode = null

  remove: (node) ->
    if node.pre
      node.pre.next = node.next
    else
      @headNode = node.next

    if node.next
      node.next.pre = node.pre
    else
      @tailNode = node.pre

  insertBeginning: (node) ->
    if @headNode
      node.next = @headNode
      @headNode.pre = node
      @headNode = node
    else
      @headNode = @tailNode = node

  moveToHead: (node) ->
    @remove node
    @insertBeginning node

  clear: ->
    @headNode = @tailNode = null


class LRUCache
  constructor: (@capacity = 10, @maxAge = undefined) ->
    @_linkList = new DoubleLinkedList()
    @reset()

  logStats: ->
    console.log("lru stats",
      capacity: @capacity
      size: @size
      count: @keys().length
      percent: Math.round((@size / @capacity) * 100)
      keys: @keys()
    )

  keys: ->
    return Object.keys @_hash

  values: ->
    values = @keys().map (key) =>
      @get(key)
    return values.filter (v) -> v isnt undefined

  remove: (key) ->
    node = @_hash[key]
    throw "no node exists for key #{key}" unless node
    console.log("removing", key, node.data.size)
    @_linkList.remove node
    delete @_hash[key]
    if node.data.onDispose then node.data.onDispose.call this, node.data.key, node.data.value
    if (size = node.data.size)
      @size -= size
      size
    else
      0

  reset: ->
    @_hash = {}
    @size = 0
    @_linkList.clear()

  cleanup: (size) ->
    console.log("cleanup", size)
    freed = 0
    target = @size - size
    while @size > target
      freed += @remove @_linkList.tailNode.data.key
    console.log("freed", freed)
    freed

  set: (key, value, size = undefined, onDispose) ->
    throw "size greater than capacity" if size >= @capacity
    node = @_hash[key]
    if size
      newSize = if (node and node.data.size) then @size + size - node.data.size else @size + size
      diff = newSize - @capacity
      if diff > 0
        freed = @cleanup diff
        newSize -= freed
    if node
      node.data.value = value
      node.data.size = size
      node.data.onDispose = onDispose
      @_refreshNode node
    else
      node = createNode {key, value, onDispose, size}
      node.data.lastVisitTime = Date.now() if @maxAge
      @_linkList.insertBeginning node
      @_hash[key] = node
    @size = newSize if newSize
    return

  get: (key) ->
    node = @_hash[key]
    if !node then return undefined
    if @maxAge and @_isExpiredNode node
      @remove key
      return undefined
    @_refreshNode node
    return node.data.value

  _refreshNode: (node) ->
    node.data.lastVisitTime = Date.now()
    @_linkList.moveToHead node

  _isExpiredNode: (node) ->
    return Date.now() - node.data.lastVisitTime > @maxAge

  has: (key) -> return @_hash[key]?

if typeof module is 'object' and module.exports
  module.exports = LRUCache
else
  this.LRUCache = LRUCache
