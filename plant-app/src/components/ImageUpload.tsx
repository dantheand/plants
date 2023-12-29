import React, { useState } from "react";

const ImageUpload = ({ plant_id }: { plant_id: string }) => {
  // This is used to store the image previes as a "data URL" (string)
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          setImagePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    // You would need to implement this function to handle the actual file upload to your server
    console.log("Handle the image upload here");
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />
      {imagePreview && (
        <div>
          <img
            src={imagePreview}
            alt="Preview"
            style={{ maxWidth: "100%", maxHeight: "300px" }}
          />
          <button onClick={handleUpload}>Upload Image</button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
