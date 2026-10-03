const FileMessage =
    ({ file }) => {

        return (

            <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="file-message"
            >

                <span className="file-message__name">
                    {file.name}
                </span>

            </a>

        );

    };

export default FileMessage;
