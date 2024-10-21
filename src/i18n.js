// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Define translation resources
const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      goodbye: "Goodbye",
    },
  },
  hi: {
    translation: {
      welcome: "स्वागत है",
      goodbye: "अलविदा",
    },
  },
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

export default i18n;
