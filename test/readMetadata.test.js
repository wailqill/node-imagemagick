var assert = require('assert'),
    TestProc = require('./testproc')
    imagemagick = require('../lib/imagemagick'),

module.exports = {
  'extracts exif metadata from verbose output': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        metadata;

    im.readMetadata('/tmp/fake.jpg', function(e, m) { metadata = m; });
    proc.child.run(
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 1278x626+0+0",
        "  Depth: 8-bit",
        "  Properties:",
        "    exif:Compression: 6",
        "    exif:ExifImageLength: 1536",
        "    exif:ExifImageWidth: 2048"].join("\n"));

    proc.spawn.calls[0].with('identify', ['-verbose', '/tmp/fake.jpg'])
    assert.equal(6, metadata.exif.compression);
    assert.equal(1536, metadata.exif.exifImageLength);
    assert.equal(2048, metadata.exif.exifImageWidth);
  },
  'works with buffered data': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        buf = new Buffer(16);

    im.readMetadata({data: buf}, function() {});
    proc.child.run();

    proc.spawn.calls[0].with('identify', ['-verbose', '-']);
    proc.child.stdin.end.calls[0].with([buf],
      'Buffer passed in expected to be passed as is to the imagemagick child process');
  },
  'splits prefixes into objects': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        metadata;

    im.readMetadata('/tmp/fake.jpg', function(e, m) { metadata = m; });
    proc.child.run(
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 1278x626+0+0",
        "  Depth: 8-bit",
        "  Properties:",
        "    exif:Compression: 6",
        "    jpeg:colorspace: 2"].join("\n"));

    assert.equal(6, metadata.exif.compression);
    assert.equal(2, metadata.jpeg.colorspace);
  },
  'parses exif dates': function() {
    var proc = new TestProc(),
        im = imagemagick.config(proc),
        metadata;

    im.readMetadata('/tmp/fake.jpg', function(e, m) { metadata = m; });
    proc.child.run(
      [ "Image: /tmp/fake.jpg",
        "  Format: JPEG (Joint Photographic Experts Group JFIF format)",
        "  Geometry: 1278x626+0+0",
        "  Depth: 8-bit",
        "  Properties:",
        "    date:create: 2011-06-15T18:23:17-03:00",
        "    exif:DateTime: 2011:05:06 12:05:14"].join("\n"));

    assert.equal('2011-06-15T18:23:17-03:00', metadata.date.create);
    assert.eql(new Date('2011-05-06 12:05:14 +0000'), metadata.exif.dateTime);
  }
}
