var assert = require('assert'),
    EventEmitter = require('events').EventEmitter;

var toArray = function(args, n) { return Array.prototype.slice.call(args, n); };
var arrayEqual = function(actual, expected, msg) {
  if (undefined === msg) msg = JSON.stringify(actual) + " == " + JSON.stringify(expected)
  assert.equal(actual.length, expected.length, msg);
  for(i in actual) {
    if (actual[i] instanceof Array) arrayEqual(actual[i], expected[i], msg);
    else assert.equal(actual[i], expected[i], msg);
  }
};

var call = function() {
  var callargs = toArray(arguments);

  return {with: function() {
    var msg, args = toArray(arguments);
    if (args[0] instanceof Array) {
      args = args[0];
      msg = args[1];
    }
    arrayEqual(args, callargs, msg);
  }};
};

var funcstub = function(func) {
  var result = function() {
    var args = toArray(arguments);
    result.calls.push(call.apply(undefined, args));
    if (func !== undefined) return func.apply(undefined, args);
  };
  result.calls = [];
  return result;
};

var stub = function(obj) {
  var funcnames = toArray(arguments, 1);
  funcnames.map(function(name) {obj[name] = funcstub();});
};

var TestWriter = function () {
  stub(this, 'setEncoding', 'write', 'end');
};

var TestReader = function() {
  this.emitter = new EventEmitter();
  this.addListener = this.emitter.addListener.bind(this.emitter);
  stub(this, 'setEncoding');
};

var TestChild = function() {
  this.emitter = new EventEmitter();
  this.addListener = function() { this.emitter.addListener.apply(this.emitter, toArray(arguments)); }; 
  this.stdout = new TestReader();
  this.stderr = new TestReader();
  this.stdin = new TestWriter();
  stub(this, 'kill');
};
TestChild.prototype.run = function(data) {
  if (data === undefined) {
    data =
      [ 'Image: /tmp/picture.jpg',
        '  Format: JPEG (Joint Photographic Experts Group JFIF format)',
        '  Geometry: 1024x768+0+0',
        '  Depth: 8-bit',
        '  Properties:',
        '    exif:Compression: 6',
        '    exif:ExifImageLength: 1536',
        '    exif:ExifImageWidth: 2048'].join("\n");
  }
  this.stdout.emitter.emit('data', data);
  this.emitter.emit('exit', 0, null);
};

var TestProc = function() {
  this.spawns = [];
  var procs = [];
  var num_spawned = 0;

  var children = this.children = function(n) { return procs[n] = procs[n] || new TestChild(); }
  this.child = function() { return children(0); };
  this.spawn = funcstub(function() { return children(num_spawned++); });
};
module.exports = TestProc;

