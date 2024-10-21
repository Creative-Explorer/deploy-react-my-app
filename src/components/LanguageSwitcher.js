import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [error, setError] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleConsent = () => {
    setConsentGiven(true);
  };

  useEffect(() => {
    if (!consentGiven) return;

    const loadGoogleTranslate = () => {
      const script = document.createElement('script');
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Google Translate script loaded successfully.');
      };

      script.onerror = (event) => {
        console.error('Error loading Google Translate script:', event);
        setError('Error loading Google Translate script. Please check the console for details.');
      };

      document.body.appendChild(script);
    };

    // Define the initialization function
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            // includedLanguages: 'fr,it,pt,de,zh-CN,zh-TW,vi,es,en,te',
            includedLanguages: 'af,sq,ar,hy,az,eu,be,bn,bs,ca,hr,cs,da,nl,en,eo,et,tl,fi,fr,ga,de,el,gu,ht,ha,he,hi,hu,is,id,it,jv,ja,kn,km,ko,ku,la,lv,lt,lb,mk,ml,mn,mi,mr,my,ne,no,pl,pt,pa,ro,ru,sr,si,sk,sl,es,su,sw,sv,ta,te,th,tr,uk,ur,vi,cy,xh,yi,zu',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          }, 'google_translate_element');
          console.log('Google Translate initialized.');
        } catch (initError) {
          console.error('Error initializing Google Translate:', initError);
          setError('Error initializing Google Translate. Please check the console for details.');
        }
      } else {
        console.error('Google Translate is not defined.');
        setError('Google Translate is not available.');
      }
    };

    loadGoogleTranslate();

    return () => {
      const existingDropdown = document.getElementById('google_translate_element');
      if (existingDropdown) {
        existingDropdown.innerHTML = ''; // Clear previous dropdown
      }
      const script = document.querySelector('script[src*="translate.google.com"]');
      if (script) {
        document.body.removeChild(script); // Remove the script on cleanup
      }
    };
  }, [consentGiven]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    changeToGoogleTranslate(lng);
  };

  const changeToGoogleTranslate = (lang) => {
    const observer = new MutationObserver(() => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        console.log('Google Translate dropdown found.');
        observer.disconnect();
        select.value = lang;
        select.dispatchEvent(new Event('change'));
      } else {
        console.warn('Google Translate dropdown not found, retrying...');
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      console.error('Google Translate dropdown not found after waiting.');
    }, 5000);
  };

  return (
    <div className="language-switcher">
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!consentGiven && (
        <div className="consent-banner">
          <p>This site uses cookies to improve your experience. Do you accept?</p>
          <button onClick={handleConsent}>Accept</button>
        </div>
      )}
      <div id="google_translate_element"></div>
    </div>
  );
};

export default LanguageSwitcher;
