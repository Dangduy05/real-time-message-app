import ReactDOM
    from 'react-dom/client';

import './polyfills/nodeGlobals';
import { applyTheme, getTheme } from './services/themeService';

import App from './App';

import './services/httpClient';

import './styles/globals.css';
import './styles/chat.css';
import './styles/videoCall.css';

applyTheme(getTheme());

ReactDOM.createRoot(
    document.getElementById('root')
).render(

    <App />

);
