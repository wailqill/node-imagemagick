var assert = require('assert'),
    TestProc = require('./testproc')
    imagemagick = require('../lib/imagemagick'),

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
  },
  'allows for asynchronous input': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        returned = false;

    var child = im.identify(function() { returned = true; });
    proc.spawn.calls[0].with('identify', ['-verbose', '-']);
    assert.ok(!returned, 'Input not yet finished');

    child.stdin.write('first chunk');
    child.stdin.write('second chunk');
    assert.ok(!returned, 'Input not yet finished.');

    proc.child.run();
    assert.ok(returned, 'Child process finished. Callback should have been executed.');
  }
};
