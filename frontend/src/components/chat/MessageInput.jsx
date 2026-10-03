import {
    useEffect,
    useRef,
    useState
} from 'react';
import { FiPaperclip, FiSend, FiX } from 'react-icons/fi';

import socket
    from '../../services/socket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';

const MessageInput =
    () => {

        const [message,
            setMessage]
            = useState('');

        const [attachment,
            setAttachment] = useState(null);

        const [previewUrl,
            setPreviewUrl] = useState(null);

        const [uploading,
            setUploading] = useState(false);

        const typingTimeoutRef = useRef(null);

        const { activeChat } = useChatStore();
        const { user } = useAuthStore();

        const sendTextMessage =
            () => {

                const content = message.trim();

                if (!activeChat || !content) return;

                socket.emit(
                    'sendMessage',
                    {
                        type: 'text',
                        content,
                        chatId: activeChat._id || activeChat.id
                    }
                );

                setMessage('');
                stopTyping();

            };

        const stopTyping = () => {
            if (!activeChat || !user?._id) return;

            const chatId = activeChat._id || activeChat.id;

            socket.emit(
                'stopTyping',
                {
                    chatId,
                    userId: user._id
                }
            );

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        };

        const handleTyping = () => {
            if (!activeChat || !user?._id) return;

            const chatId = activeChat._id || activeChat.id;

            socket.emit(
                'typing',
                {
                    chatId,
                    userId: user._id
                }
            );

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit(
                    'stopTyping',
                    {
                        chatId,
                        userId: user._id
                    }
                );
                typingTimeoutRef.current = null;
            }, 5000);
        };

        const handleFileChange = (file) => {
            if (!file) {
                setAttachment(null);
                setPreviewUrl(null);
                return;
            }

            setAttachment(file);
            if (file.type?.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }
        };

        const sendFileMessage =
            async (file) => {

                if (!activeChat || !file) return;

                try {
                    setUploading(true);

                    const formData =
                        new FormData();

                    formData.append(
                        'file',
                        file
                    );

                    const { uploadFile } =
                        await import('../../api/uploadApi');

                    const { fileUrl } =
                        await uploadFile(formData);

                    const isImage =
                        file.type?.startsWith('image/');

                    socket.emit(
                        'sendMessage',
                        {
                            type: isImage ? 'image' : 'file',
                            content: fileUrl,
                            chatId: activeChat._id || activeChat.id
                        }
                    );
                } finally {
                    setUploading(false);
                    setAttachment(null);
                    setPreviewUrl(null);
                }

            };

        useEffect(() => {
            return () => {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                stopTyping();
            };
        }, [activeChat]);

        useEffect(() => {
            return () => {
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
            };
        }, [previewUrl]);

        return (

            <div className="composer">
                {attachment && (
                    <div className="attachment-preview">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="preview"
                                className="image-preview max-h-64 max-w-full object-contain"
                            />
                        ) : (
                            <div className="text-sm text-slate-200">
                                Attached file: {attachment.name}
                            </div>
                        )}
                        <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => handleFileChange(null)}
                                className="secondary-button px-3"
                            >
                                <FiX />
                                Remove
                            </button>
                            <button
                                type="button"
                                onClick={() => sendFileMessage(attachment)}
                                disabled={uploading}
                                className="primary-button px-3"
                            >
                                <FiSend />
                                {uploading ? 'Sending...' : 'Send attachment'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="composer-row">
                    <textarea
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            handleTyping();
                        }}
                        onBlur={stopTyping}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendTextMessage();
                            }
                        }}
                        placeholder="Nhập tin nhắn..."
                        rows={1}
                    />

                    <label className="icon-button cursor-pointer" title="Attach file">
                        <FiPaperclip />
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                handleFileChange(file);
                                e.target.value = '';
                            }}
                            disabled={uploading}
                        />
                    </label>

                    <button
                        onClick={sendTextMessage}
                        className="icon-button primary-button"
                        title="Send message"
                        disabled={!message.trim()}
                    >
                        <FiSend />
                    </button>
                </div>
            </div>

        );

    };

export default MessageInput;
