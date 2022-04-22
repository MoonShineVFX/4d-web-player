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


function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


function fetchWithProgress(url, headers, progress) {
  headers = headers || {};
  return fetch(url, headers).then(response => {
    const contentLength = Number(response.headers.get('content-length'));
    let loaded = 0;

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        for (;;) {
          const {done, value} = await reader.read();
          if (done) break;
          loaded += value.byteLength;
          progress(loaded/contentLength);
          controller.enqueue(value);
        }
        controller.close();
      },
    });
    const res = new Response(readableStream);
    return res.blob().then(blob => blob.arrayBuffer());
  })
}