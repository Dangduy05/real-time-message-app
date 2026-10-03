const ImagePreview =
    ({ image }) => {

        return (

            <img
                src={image}
                alt="preview"
                className="
          w-32
          image-preview
        "
            />

        );

    };

export default ImagePreview;
