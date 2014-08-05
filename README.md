nodejs-tools
============

Various tools for nodejs to be used anywhere.

largeObject
===========

Used to simulate large objects.
Objects are getting slow, when it contains too many keys. To prevent this, use LargeObject

```
var LO= require('.largeObject').LargeObject;
var x= LO({ template: 'object' }, 5);
x('foor', 'bar'); // same as x['foo']= 'bar' or x.foo= 'bar'
x('foo'); // same as x['foo'] or x.foo
x.has('foo'); // same as 'foo' in x
x.forEach(function( key, value ) {...}); // same as Object.keys(x).forEach(function(key) {var value= x[key];...})
x.delete('foo'); // same as delete x['foo'] or delete x.foo
```
