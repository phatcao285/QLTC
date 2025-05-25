// i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import các file ngôn ngữ
import en from './translations/en.json';
import vi from './translations/vi.json';

// Bộ nhớ tạm thời
let currentLanguage = 'vi';

// Language detector đơn giản không cần AsyncStorage
const simpleLanguageDetector = {
  type: 'languageDetector',
  async: true,
  detect: (callback) => {
    // Sử dụng ngôn ngữ hiện tại từ bộ nhớ tạm thời
    callback(currentLanguage);
  },
  init: () => {},
  cacheUserLanguage: (language) => {
    // Lưu ngôn ngữ vào bộ nhớ tạm thời
    currentLanguage = language;
  }
};

// Hàm tiện ích để thay đổi ngôn ngữ (sử dụng thay cho AsyncStorage)
export const changeLanguageWithoutStorage = (language) => {
  currentLanguage = language;
  return i18n.changeLanguage(language);
};

i18n
  // Sử dụng detector đơn giản
  .use(simpleLanguageDetector)
  // Kết nối với react-i18next
  .use(initReactI18next)
  // Khởi tạo i18next
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi }
    },
    fallbackLng: 'vi',
    debug: true,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;