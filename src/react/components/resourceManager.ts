const isFirebaseHosting = window.location.hostname.includes('4drec.com');

export default function gerResourceUrl(path: string): string {
  if (isFirebaseHosting) return `https://storage.googleapis.com/drec-player.appspot.com/${path}`;
  return `/resource/${path}`;
}
