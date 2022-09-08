import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from './firebaseConfig.json';


const isProduction = process.env.NODE_ENV === 'production';


let storage: FirebaseStorage;
if (isProduction) {
  const app = initializeApp(firebaseConfig);
  storage = getStorage(app, 'gs://' + firebaseConfig.storageBucket);
}

export default function getFirebaseUrl(path: string): Promise<string> {
  if (isProduction) return getDownloadURL(ref(storage, path));
  return new Promise<string>(resolve => resolve(`/resource/${path}`));
}
