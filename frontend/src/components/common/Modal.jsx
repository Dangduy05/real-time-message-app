const Modal =
    ({
        open,
        children
    }) => {

        if (!open)
            return null;

        return (

            <div
                className="
          fixed
          inset-0
          bg-black/50
          flex
          items-center
          justify-center
        "
            >

                <div
                    className="
            bg-white
            p-6
            rounded-2xl
          "
                >

                    {children}

                </div>

            </div>

        );

    };

export default Modal;