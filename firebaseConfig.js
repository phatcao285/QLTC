import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  // Thông tin cấu hình của bạn từ Firebase Console
  apiKey: "AIzaSyCTFKYvO9xGVu0QSnjdKmuG8ehtGZpeZhs",
  authDomain: "quanlytc-1ef47.firebaseapp.com",
  projectId: "quanlytc-1ef47",
  storageBucket: "quanlytc-1ef47.appspot.com",
  messagingSenderId: "308796824790",
  appId: "1:308796824790:android:3b46910f87fd3427ee7d77"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

export default app;
