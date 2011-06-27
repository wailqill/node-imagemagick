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
  },
  'accepts emitter at dstStream parameter': function() {
    var proc = new TestProc,
        im = imagemagick.config(proc),
        emissions = [],
        emitter = {emit: function(event, data) { emissions.push([event, data]); }};

    im.resize({srcPath: '/tmp/fake.jpg', dstStream: emitter, width: 422});
    proc.spawn.calls[0].with('convert', [
      '/tmp/fake.jpg',
      '-set', 'option:filter:blur', '0.8',
      '-filter', 'Lagrange',
      '-strip',
      '-resize', '422',
      '-quality', '80',
      'jpg:-']);

    assert.equal(emissions.length, 0);
    proc.child().stdout.emitter.emit('data', '1');
    assert.equal(emissions.length, 1);
    assert.eql(emissions[0], ['data', '1']);

    proc.child().stdout.emitter.emit('data', '2');
    proc.child().stdout.emitter.emit('data', '3');
    assert.equal(emissions.length, 3);
    assert.eql(emissions[1], ['data', '2']);
    assert.eql(emissions[2], ['data', '3']);

    proc.child().emitter.emit('exit', 0, null);
    assert.equal(emissions.length, 4);
    assert.eql(emissions[3], ['end', null]);
  }
};
