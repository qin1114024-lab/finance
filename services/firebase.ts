import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { Account, StockHolding, Transaction, User } from "../types";

// 使用 Vite 的環境變數 (需要在 .env 檔案或 GitHub Secrets 中設定)
// Cast import.meta to any to prevent TS errors when vite/client types are missing
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let db: any = null;

try {
  // 只有當 Config 存在時才初始化，避免在沒有 Key 的情況下報錯
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else {
    console.warn("Firebase config is missing. App is running in offline/demo mode.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// 定義 UserData 介面以符合 Firestore 存儲結構
export interface UserData {
  accounts: Account[];
  stocks: StockHolding[];
  transactions: Transaction[];
  lastUpdated: string;
}

export const loadUserData = async (username: string): Promise<UserData | null> => {
  if (!db) return null;
  
  try {
    const docRef = doc(db, "users", username);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error loading data from Firebase:", error);
    return null;
  }
};

export const saveUserData = async (username: string, data: Omit<UserData, 'lastUpdated'>) => {
  if (!db) return;

  try {
    const docRef = doc(db, "users", username);
    await setDoc(docRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving data to Firebase:", error);
  }
};

export const isFirebaseReady = () => !!db;