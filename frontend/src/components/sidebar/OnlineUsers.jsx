const OnlineUsers =
    ({ users }) => {

        return (

            <div>

                {
                    users.map((user) => (

                        <div key={user}>

                            {user}

                        </div>

                    ))
                }

            </div>

        );

    };

export default OnlineUsers;