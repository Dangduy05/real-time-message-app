import useAuthStore from '../../store/authStore';
import { resolveFileUrl } from '../../utils/fileUrl';
import { FiDownload, FiFile } from 'react-icons/fi';
import MarkdownMessage from './MarkdownMessage';

const ChatBubble =
    ({ message, sender }) => {

        const {
            user
        } = useAuthStore();

        const currentUserId = user?._id;
        const isOutgoing =
            String(message?.senderId) === String(currentUserId);

        const isImage = message?.type === 'image';
        const isFile = message?.type === 'file';
        const seenBy = Array.isArray(message?.seenBy) ? message.seenBy : [];
        const seenByOtherUser =
            seenBy.some((id) => String(id) !== String(currentUserId));
        const fileName =
            message?.content?.split('/')?.pop();
        const fileUrl =
            resolveFileUrl(message?.content);
        const senderName =
            sender?.fullName || sender?.name || sender?.email || (isOutgoing ? (user?.fullName || user?.email || 'You') : 'User');
        const senderAvatarUrl =
            resolveFileUrl(sender?.avatar);
        const senderInitials =
            senderName
                .split(' ')
                .map((part) => part.charAt(0))
                .join('')
                .slice(0, 2)
                .toUpperCase();

        return (

            <div
                className={
                    `
          mb-3
          flex
          items-end
          gap-2
          ${isOutgoing ? 'justify-end flex-row-reverse' : 'justify-start'}
        `
                }
            >
                <div className="avatar avatar--sm message-avatar">
                    {senderAvatarUrl ? (
                        <img
                            src={senderAvatarUrl}
                            alt={`${senderName} avatar`}
                            className="avatar-image"
                        />
                    ) : (
                        senderInitials
                    )}
                </div>

                <div
                    className={
                        `
          chat-bubble
          ${isOutgoing ? 'chat-bubble--outgoing' : 'chat-bubble--incoming'}
        `
                    }
                >

                    <div
                        className={
                            `
                chat-bubble__bubble
                ${isOutgoing ? 'chat-bubble__bubble--outgoing' : 'chat-bubble__bubble--incoming'}
              `
                        }
                    >

                        <div className="chat-bubble__sender truncate-text">
                            {senderName}
                        </div>

                        {isImage ? (
                            <img
                                src={fileUrl}
                                alt="shared"
                                className="image-preview max-h-[360px] max-w-full object-contain"
                            />
                        ) : isFile ? (
                            <div className="file-message">
                                <FiFile />
                                <span className="file-message__name">{fileName || 'Attachment'}</span>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="icon-button h-8 w-8"
                                    title="Download file"
                                >
                                    <FiDownload />
                                </a>
                            </div>
                        ) : (
                            <MarkdownMessage content={message.content} />
                        )}

                        <div className="chat-meta">
                            {message?.createdAt && (
                                <span>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {isOutgoing && (
                                <span>
                                    {seenByOtherUser ? 'Seen' : 'Sent'}
                                </span>
                            )}
                        </div>

                    </div>

                </div>

            </div>

        );

    };

export default ChatBubble;
