import { i as reactFactory, t as reactDomFactory } from './framework-CXnKph_e.js';
import App from './page-endash.js?v=duration1';
import './wall-forward.js?v=logo-home1';

const React = reactFactory();
const ReactDOM = reactDomFactory();
const requestedLanguage = window.location.hash === '#en' ? 'en' : 'lv';

try {
  localStorage.setItem('lu107-language', requestedLanguage);
} catch {}

document.documentElement.lang = requestedLanguage;
document.title = requestedLanguage === 'en'
  ? 'How Well Do You Know the University of Latvia?'
  : 'Cik labi Tu pazīsti Latvijas Universitāti?';

ReactDOM.hydrateRoot(
  document.getElementById('root'),
  React.createElement(App),
  { onRecoverableError() {} },
);
