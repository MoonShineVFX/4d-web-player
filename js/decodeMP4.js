const canvas = document.getElementById('canva');
const ctx = canvas.getContext('2d');


class Writer {
  constructor(size) {
    this.data = new Uint8Array(size);
    this.idx = 0;
    this.size = size;
  }

  getData() {
    if(this.idx !== this.size)
      throw "Mismatch between size reserved and sized used"

    return this.data.slice(0, this.idx);
  }

  writeUint8(value) {
    this.data.set([value], this.idx);
    this.idx++;
  }

  writeUint16(value) {
    var arr = new Uint16Array(1);
    arr[0] = value;
    var buffer = new Uint8Array(arr.buffer);
    this.data.set([buffer[1], buffer[0]], this.idx);
    this.idx +=2;
  }

  writeUint8Array(value) {
    this.data.set(value, this.idx);
    this.idx += value.length;
  }
}


function getExtradata(avccBox) {
  var i;
  var size = 7;
  for (i = 0; i < avccBox.SPS.length; i++) {
    // nalu length is encoded as a uint16.
    size+= 2 + avccBox.SPS[i].length;
  }
  for (i = 0; i < avccBox.PPS.length; i++) {
    // nalu length is encoded as a uint16.
    size+= 2 + avccBox.PPS[i].length;
  }

  var writer = new Writer(size);

  writer.writeUint8(avccBox.configurationVersion);
  writer.writeUint8(avccBox.AVCProfileIndication);
  writer.writeUint8(avccBox.profile_compatibility);
  writer.writeUint8(avccBox.AVCLevelIndication);
  writer.writeUint8(avccBox.lengthSizeMinusOne + (63<<2));

  writer.writeUint8(avccBox.nb_SPS_nalus + (7<<5));
  for (i = 0; i < avccBox.SPS.length; i++) {
    writer.writeUint16(avccBox.SPS[i].length);
    writer.writeUint8Array(avccBox.SPS[i].nalu);
  }

  writer.writeUint8(avccBox.nb_PPS_nalus);
  for (i = 0; i < avccBox.PPS.length; i++) {
    writer.writeUint16(avccBox.PPS[i].length);
    writer.writeUint8Array(avccBox.PPS[i].nalu);
  }

  return writer.getData();
}


decodeFrameNumber = -1;
let sampleCount = undefined;
const decoder = new VideoDecoder({
  output : frame => {
    decodeFrameNumber += 1;
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    frame.close();
    console.log('                decode f: ', decodeFrameNumber);
    if (decodeFrameNumber === sampleCount - 2 - 1) {
      console.log('flush');
      decoder.flush();
    }
  },
  error : e => console.error(e),
});


const mp4box = MP4Box.createFile();

mp4box.onSamples = (track_id, user, samples) => {
  console.log('Samples: ', samples.length);
  for (const sample of samples) {
    console.log(sample.number);
    const type = sample.is_sync ? "key" : "delta";
    const chunk = new EncodedVideoChunk({
      type: type,
      timestamp: sample.cts,
      duration: sample.duration,
      data: sample.data
    });

    decoder.decode(chunk);
  }
}

mp4box.onReady = info => {
  console.log(info);
  const track = info.videoTracks[0];

  sampleCount = track.nb_samples

  const AvccBox = mp4box.moov.traks[0].mdia.minf.stbl.stsd.entries[0].avcC
  decoder.configure({
    codec: track.codec,
    codedHeight: track.track_height,
    codedWidth: track.track_width,
    description: getExtradata(AvccBox)
  });
  canvas.width = track.track_width;
  canvas.height = track.track_height;

  mp4box.setExtractionOptions(track.id, 'iamuser', {nbSamples: 1});
  mp4box.start();
};

mp4box.onError = error => {
  console.error(error);
}


fetch('texture_2k_debug_fr.mp4').then(
  response => response.arrayBuffer()
).then(
  buffer => {
    let cursor = 0;
    const unit = 1024 * 1024;
    function assignBuffer() {
      const sliceBuffer = buffer.slice(cursor, cursor + unit);
      sliceBuffer.fileStart = cursor;
      mp4box.appendBuffer(sliceBuffer);
      cursor += unit;
      console.log('cursor: ' + cursor);
      setTimeout(assignBuffer, 1000);
    }
    assignBuffer();
  }
);


document.addEventListener('keydown', event => {
  if (event.code === 'KeyD') {
    mp4box.start();
  }
})