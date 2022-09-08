import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import firebaseConfig from './firebaseConfig.json';


const app = initializeApp(firebaseConfig);
const storage = getStorage(app, 'gs://' + firebaseConfig.storageBucket);


export default function getFirebaseUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}
