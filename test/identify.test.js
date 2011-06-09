var assert = require('assert'),
    imagemagick = require('../lib/imagemagick'),
    EventEmitter = require('events').EventEmitter;

var toArray = function(args, n) { return Array.prototype.slice.call(args, n); };
var arrayEqual = function(actual, expected, msg) {
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
  this.addListener = this.emitter.addListener.bind(this.emitter);
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
        '  Depth: 8-bit'].join("\n")
  }
  this.stdout.emitter.emit('data', data);
  this.emitter.emit('exit', 0, null);
};

var TestProc = function() {
  this.spawns = [];
  var child = this.child = new TestChild();

  this.spawn = funcstub(function() { return child; });
};

module.exports = {
  'test uses verbose flag and parses output with path argument': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        features;

    im.identify('/tmp/fake.jpg', function(err, f) { features = f; });
    proc.child.run(
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 1278x626+0+0",
        "  Depth: 8-bit"].join("\n"));

    proc.spawn.calls[0].with('identify', ['-verbose', '/tmp/fake.jpg'])
    assert.equal('JPEG', features.format);
    assert.equal(1278, features.width);
    assert.equal(626, features.height);
    assert.equal(8, features.depth);
  },
  'test feeds string data into child proc': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc);

    im.identify({data: "testing"}, function() {});
    proc.child.run();

    proc.child.stdin.write.calls[0].with('testing', 'binary');
  },
  'test feeds buffer data into child proc': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        buf = new Buffer(32);

    im.identify({data: buf}, function() {});
    proc.child.run();

    proc.child.stdin.end.calls[0].with([buf],
      'Buffer passed in expected to be passed as is to the imagemagick child process');
  }
};
