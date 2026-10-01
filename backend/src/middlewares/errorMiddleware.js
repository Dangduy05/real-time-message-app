module.exports =
    (err, req, res, next) => {

        if (
            err.name === 'MulterError'
            || err.message === 'Unsupported file type'
        ) {

            return res.status(400).json({
                message: err.message
            });

        }

        console.error(err);

        res.status(500).json({

            message:
                'Internal Server Error'

        });

    };
