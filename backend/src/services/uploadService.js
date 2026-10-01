exports.validateFile =
    (file) => {

        const allowedTypes = [

            'image/png',

            'image/jpeg',

            'application/pdf'

        ];

        return allowedTypes.includes(
            file.mimetype
        );

    };