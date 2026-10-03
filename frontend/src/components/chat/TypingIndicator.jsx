const TypingIndicator =
    ({ typingUser }) => {

        if (!typingUser)
            return null;

        return (

            <div
                className="px-5 py-2 text-sm text-slate-400"
            >

                {typingUser} is typing...

            </div>

        );

    };

export default TypingIndicator;
