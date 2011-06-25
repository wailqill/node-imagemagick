var assert = require('assert'),
    TestProc = require('./testproc')
    imagemagick = require('../lib/imagemagick'),

module.exports = {
  'test uses verbose flag and parses output with path argument': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        features;

    im.identify('/tmp/fake.jpg', function(err, f) { features = f; });
    proc.child().run(
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 1278x626+0+0",
        "  Depth: 8-bit"].join("\n"));

    proc.spawn.calls[0].with('identify', ['-verbose', '/tmp/fake.jpg'])
    assert.equal('JPEG', features.format);
    assert.equal(1278, features.width);
    assert.equal(626, features.height);
    assert.equal(8, features.depth);
    assert.isUndefined(features.quality);
  },
  'test feeds string data into child proc': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc);

    im.identify({data: "testing"}, function() {});
    proc.child().run();

    proc.child().stdin.write.calls[0].with('testing', 'binary');
  },
  'test feeds buffer data into child proc': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        buf = new Buffer(32);

    im.identify({data: buf}, function() {});
    proc.child().run();

    proc.child().stdin.end.calls[0].with([buf],
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

    proc.child(0).run();
    assert.ok(returned, 'Child process finished. Callback should have been executed.');
  },
  'spawns process with custom args': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc);

    im.identify(['my', 'custom', 'args'], function() {});
    proc.spawn.calls[0].with('identify', ['my', 'custom', 'args']);
    proc.child().run();
  },
  'callback receives raw output when custom args given': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        output;

    im.identify(['my', 'custom', 'args'], function(e, o) { output = o; });
    proc.child().run("let's pretend imagemagick emitted this");
    assert.equal("let's pretend imagemagick emitted this", output);
  },
  'allows asynchronous input with custom args': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        output;

    var child = im.identify(['-ping', '-'], function(e, o) { output = o; });
    proc.spawn.calls[0].with('identify', ['-ping', '-']);
    assert.ok(!output, 'Input not yet finished');

    child.stdin.write('first chunk');
    child.stdin.write('second chunk');
    assert.ok(!output, 'Input not yet finished.');

    proc.child().run("fake output");
    assert.equal("fake output", output);
  },
  'parses quality when present': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        features;

    im.identify(function(err, f) { features = f; });
    proc.child().run(
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 120x90+0+0",
        "  Resolution: 72x72",
        "  Depth: 8-bit",
        "  Colorspace: RGB",
        "  Quality: 78",
        "  Orientation: Undefined",
        "  Filesize: 8.07KB"].join("\n"));

    assert.equal(0.78, features.quality);
  },
  'parses arbitrary info from im output': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        features;

    im.identify(function(err, f) { features = f; });
    proc.child().run(
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 120x90+0+0",
        "  Depth: 8-bit",
        "  Properties:",
        "    exif:ApertureValue: 30/10",
        "    exif:DateTime: 2011:05:06 12:05:14",
        "  Colorspace: RGB"].join("\n"));

    assert.equal('RGB', features['Colorspace']);
    assert.equal('30/10', features['Properties']['exif:ApertureValue']);
    assert.equal('2011:05:06 12:05:14', features['Properties']['exif:DateTime']);
  }
};
