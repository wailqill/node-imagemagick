var assert = require('assert'),
    TestProc = require('./testproc'),
    imagemagick = require('../lib/imagemagick');

module.exports = {
  'result object works as input stream': function() {
    var proc = new TestProc,
        im = imagemagick.config(proc);

    var stream = im.convert(['-', '-resize', '25x120', 'kittens-small.jpg'])
    stream.write('qw', 'binary');

    proc.child().stdin.write.calls[0].with('qw', 'binary');

    stream.write('erty', 'binary');
    stream.end();

    proc.child().stdin.write.calls[1].with('erty', 'binary');
    proc.child().stdin.end.calls[0].with();
  }
};
