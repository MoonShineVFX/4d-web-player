export function nextWithLoop(currentIndex: number, count: number): number {
  return (currentIndex + 1) % count;
}


function pad(n: number, width: number, z: string | null): string {
  z = z || '0';
  const nString: string = n + '';
  if (nString.length >= width) return nString;
  return new Array(width - nString.length + 1).join(z) + nString;
}


function fetchWithProgress(
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
