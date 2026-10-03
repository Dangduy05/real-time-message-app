const ScreenShare =
    () => {

        const startShare =
            async () => {

                const stream =
                    await navigator
                        .mediaDevices
                        .getDisplayMedia({

                            video: true

                        });

                console.log(stream);

            };

        return (

            <button
                onClick={startShare}
            >

                Share Screen

            </button>

        );

    };

export default ScreenShare;