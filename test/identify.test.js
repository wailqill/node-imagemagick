var assert = require('assert'),
    imagemagick = require('../lib/imagemagick'),
    EventEmitter = require('events').EventEmitter;

var TestStream = function() {
  this.emitter = new EventEmitter();
  this.addListener = this.emitter.addListener.bind(this.emitter);
  this.setEncoding = function() {};
};

var TestChild = function() {
  this.emitter = new EventEmitter();
  this.kill = function() {};
  this.addListener = this.emitter.addListener.bind(this.emitter);
  this.stdout = new TestStream();
  this.stderr = new TestStream();
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
    proc.child.stdout.emitter.emit('data',
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 1278x626+0+0",
        "  Depth: 8-bit"].join("\n"));
    proc.child.emitter.emit('exit', 0, null);

    assert.equal('identify', proc.spawns[0][0]);
    assert.equal('-verbose', proc.spawns[0][1][0]);
    assert.equal('/tmp/fake.jpg', proc.spawns[0][1][1]);
    assert.equal('JPEG', features.format);
    assert.equal(1278, features.width);
    assert.equal(626, features.height);
    assert.equal(8, features.depth);
  }
};
