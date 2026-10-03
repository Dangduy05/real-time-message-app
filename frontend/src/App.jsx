import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import LoginPage
    from './pages/LoginPage';

import RegisterPage
    from './pages/RegisterPage';

import ChatPage
    from './pages/ChatPage';

import ProfilePage
    from './pages/ProfilePage';

import SettingsPage
    from './pages/SettingsPage';

import CallPage
    from './pages/CallPage';

import StatusPage
    from './pages/StatusPage';

function App() {


    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<LoginPage />}
                />

                <Route
                    path="/register"
                    element={<RegisterPage />}
                />

                <Route
                    path="/chat"
                    element={<ChatPage />}
                />

                <Route
                    path="/profile"
                    element={<ProfilePage />}
                />

                <Route
                    path="/settings"
                    element={<SettingsPage />}
                />
                
                <Route
                    path="/call/:friendId"
                    element={<CallPage />}
                />

                <Route
                    path="/status"
                    element={<StatusPage />}
                />




            </Routes>

        </BrowserRouter>

    );

}

export default App;
