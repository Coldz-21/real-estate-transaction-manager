import React, { useState } from 'react';

const ImageModal = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="image-modal" onClick={onClose}>
      <button className="image-modal-close" onClick={onClose}>
        ×
      </button>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={`/api/loops/images/${image.filename}`}
          alt={image.originalName || 'Property image'}
        />
      </div>
    </div>
  );
};

const ImageGallery = ({ images = [], maxThumbnails = 3 }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) {
    return null;
  }

  const visibleImages = images.slice(0, maxThumbnails);
  const remainingCount = images.length - maxThumbnails;

  const openImage = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <div className="loop-images">
        {visibleImages.map((image, index) => (
          <img
            key={index}
            src={`/api/loops/images/${image.filename}`}
            alt={image.originalName || `Property image ${index + 1}`}
            className="loop-image-thumbnail"
            onClick={() => openImage(image)}
            title={`Click to view ${image.originalName || 'image'}`}
          />
        ))}
        
        {remainingCount > 0 && (
          <div className="loop-images-count">
            +{remainingCount}
          </div>
        )}
      </div>

      <ImageModal image={selectedImage} onClose={closeModal} />
    </>
  );
};

export default ImageGallery;
