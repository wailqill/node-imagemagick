var assert = require('assert'),
    TestProc = require('./testproc')
    imagemagick = require('../lib/imagemagick'),

module.exports = {
  '': function() {
    var proc = new TestProc,
        im = imagemagick.config(proc);

    im.crop({srcPath: '/tmp/fake.jpg', dstPath: '/tmp/cropped.jpg', width: 58, height: 58});
    proc.children(0).run(
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 640x584+0+0",
        "  Depth: 8-bit"].join("\n"));
    proc.children(1).run();

    assert.equal(proc.spawn.calls.length, 2);
    proc.spawn.calls[0].with('identify', ['-verbose', '/tmp/fake.jpg']);
    proc.spawn.calls[1].with('convert', [
      '/tmp/fake.jpg',
      '-set', 'option:filter:blur', '0.8',
      '-filter', 'Lagrange',
      '-strip',
      '-resize', 'x58',
      '-gravity', 'Center',
      '-crop', '58x58+0+0',
      '+repage',
      '-quality', '80',
      '/tmp/cropped.jpg']);
  }
};
