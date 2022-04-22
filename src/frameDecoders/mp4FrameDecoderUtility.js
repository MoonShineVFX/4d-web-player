// Source: https://github.com/w3c/webcodecs/blob/main/samples/mp4-decode/mp4_demuxer.js


class BinaryWriter {
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


export function getAvccData(avccBox) {
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

  var writer = new BinaryWriter(size);

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
