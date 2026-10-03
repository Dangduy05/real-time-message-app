import { Link } from 'react-router-dom';
import { FiMessageCircle, FiSettings, FiUser } from 'react-icons/fi';

import ProfileCard from '../profile/ProfileCard';

import GroupList from './GroupList';
import FriendList from './FriendList';
import FriendActions from './FriendActions';

const Sidebar = ({ onAfterAction }) => {

    return (

        <aside className="app-sidebar">

            <div className="sidebar-header">

                <ProfileCard compact />

                <div className="nav-row">
                    <Link
                        to="/chat"
                        className="nav-button"
                        title="Chat"
                    >
                        <FiMessageCircle />
                        Chat
                    </Link>
                    <Link
                        to="/profile"
                        className="nav-button"
                        title="Profile"
                    >
                        <FiUser />
                        Profile
                    </Link>
                    <Link
                        to="/settings"
                        className="nav-button"
                        title="Settings"
                    >
                        <FiSettings />
                        Settings
                    </Link>
                </div>

            </div>

            <div className="sidebar-scroll chat-scrollbar">
                <FriendActions onAfterAction={onAfterAction} />

                <GroupList />

                <FriendList />
            </div>

        </aside>

    );

};

export default Sidebar;

