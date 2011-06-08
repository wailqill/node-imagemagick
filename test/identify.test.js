var assert = require('assert'),
    imagemagick = require('../lib/imagemagick'),
    EventEmitter = require('events').EventEmitter;

var TestWriter = function () {
  this.writes = [];
  this.ends = [];
  this.setEncoding = function() {};
  this.write = function() { this.writes.push(arguments); };
  this.end = function() { this.ends.push(arguments); };
};

var TestReader = function() {
  this.emitter = new EventEmitter();
  this.addListener = this.emitter.addListener.bind(this.emitter);
  this.setEncoding = function() {};
};

var TestChild = function() {
  this.emitter = new EventEmitter();
  this.kill = function() {};
  this.addListener = this.emitter.addListener.bind(this.emitter);
  this.stdout = new TestReader();
  this.stderr = new TestReader();
  this.stdin = new TestWriter();
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
  this.child = new TestChild();

  this.spawn = function(prog, args) {
    this.spawns.push([prog, args]);
    return this.child;
  };
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

    assert.equal('identify', proc.spawns[0][0]);
    assert.equal('-verbose', proc.spawns[0][1][0]);
    assert.equal('/tmp/fake.jpg', proc.spawns[0][1][1]);
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

    assert.equal('testing', proc.child.stdin.writes[0][0]);
    assert.equal('binary', proc.child.stdin.writes[0][1]);
  },
  'test feeds buffer data into child proc': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        buf = new Buffer(32);

    im.identify({data: buf}, function() {});
    proc.child.run();

    assert.equal(buf, proc.child.stdin.ends[0][0],
      'Buffer passed in expected to be passed as is to the imagemagick child process');
  }
};
