import {initializeApp} from 'firebase/app';
import {FirebaseStorage, getDownloadURL, getStorage, ref} from 'firebase/storage';


const isFirebaseHosting = window.location.hostname.includes('4drec.com');
let getFirebaseStorage: Promise<FirebaseStorage>;
if (isFirebaseHosting) {
  getFirebaseStorage = (async (): Promise<FirebaseStorage> => {
    const response = await fetch('/__/firebase/init.json');
    const firebaseConfig = await response.json();
    const app = initializeApp(firebaseConfig);
    return getStorage(app, 'gs://' + firebaseConfig.storageBucket);
  })();
}

export default function gerResourceUrl(path: string): Promise<string> {
  if (isFirebaseHosting) return getFirebaseStorage.then(storage => getDownloadURL(ref(storage, path)));
  return new Promise<string>(resolve => resolve(`/resource/${path}`));
}
