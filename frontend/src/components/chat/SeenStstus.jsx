const SeenStatus =
    ({ seen }) => {

        return (

            <span
                className="
          text-xs
          text-gray-400
        "
            >

                {
                    seen
                        ? 'Seen'
                        : 'Delivered'
                }

            </span>

        );

    };

export default SeenStatus;