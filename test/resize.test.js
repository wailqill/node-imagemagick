var assert = require('assert'),
    TestProc = require('./testproc')
    imagemagick = require('../lib/imagemagick'),

module.exports = {
  'call with default values and srcPath, dstPath as filenames': function() {
    var proc = new TestProc,
        im = imagemagick.config(proc);

    im.resize({srcPath: '/tmp/fake.jpg', dstPath: '/tmp/fake-transformed.jpg', height: 240});
    proc.child().run();

    proc.spawn.calls[0].with('convert', [
      '/tmp/fake.jpg',
      '-set', 'option:filter:blur', '0.8',
      '-filter', 'Lagrange',
      '-strip',
      '-resize', 'x240',
      '-quality', '80',
      '/tmp/fake-transformed.jpg']);
  }
};
