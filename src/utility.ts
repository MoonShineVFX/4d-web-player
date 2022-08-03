export function pad(num: number, length: number, padString: string = '0'): string {
  const nString: string = num + '';
  if (nString.length >= length) return nString;
  return new Array(length - nString.length + 1).join(padString) + nString;
}


export function fetchWithProgress(
  url: string, headers: object, progress: (progress: number) => void
): Promise<ArrayBuffer> {
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
