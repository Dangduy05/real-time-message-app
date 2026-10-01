exports.uploadFile =
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    message: 'File is required'
                });

            }

            res.json({

                fileUrl:
                    `/uploads/files/${req.file.filename}`

            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };
