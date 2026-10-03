import {
    uploadFile
} from '../../api/uploadApi';

const FileUpload =
    () => {

        const handleUpload =
            async (e) => {

                const formData =
                    new FormData();

                formData.append(
                    'file',
                    e.target.files[0]
                );

                await uploadFile(
                    formData
                );

            };

        return (

            <input
                type="file"
                onChange={handleUpload}
            />

        );

    };

export default FileUpload;