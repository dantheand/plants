import React, { useRef, useState } from "react";
import { Button, Form, Image, Spinner } from "react-bootstrap";
import { useAlert } from "../context/Alerts";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import resizeImageWithPica from "../utils/images";

interface ImageUploadProps {
  plant_id: string;
  closeModal: () => void;
  onUploadSuccess: () => void;
}

const ImageUpload = ({
  plant_id,
  closeModal,
  onUploadSuccess,
}: ImageUploadProps) => {
  const [useCamera, setUseCamera] = useState<boolean>(true);
  // This is used to store the image preview as a "data URL" (string)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { showAlert } = useAlert();

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

  const resetFileInput = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    if (
      !fileInputRef.current ||
      !fileInputRef.current.files ||
      fileInputRef.current.files.length === 0
    ) {
      showAlert("No file selected", "warning");
      return;
    }
    const file = fileInputRef.current?.files[0];
    try {
      const resizedImage = await resizeImageWithPica(file, 1000, 1000);

      const formData = new FormData();
      formData.append("image_file", resizedImage);
      // TODO: enable timestamp data input
      // formData.append('timestamp', new Date().toISOString());

      const response = await fetch(
        `${BASE_API_URL}/new_images/plants/${plant_id}`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        closeModal();
        onUploadSuccess();
        showAlert(
          `Image uploaded successfully. Image ID: ${result.image_id}`,
          "success",
        );
        // TODO: figure out why this error handling isn't working (can upload a .png and get a 500 error)
      } else {
        console.error(`Upload failed with status: ${response.status}`);
        showAlert(`Upload failed. HTTP status: ${response.status}`, "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert(`Resizer error, ${error}`, "danger");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <Form>
        <Form.Group controlId="formFile" className="m-3">
          <Form.Control
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture={useCamera ? "environment" : undefined}
            onChange={handleFileChange}
          />
          <Form.Check
            className="mt-2"
            type="switch"
            id="custom-switch"
            label={"Use Camera"}
            checked={useCamera}
            onChange={() => setUseCamera(!useCamera)}
          />
        </Form.Group>
      </Form>
      {isUploading ? (
        <div>
          <Spinner />
          Uploading image...
        </div>
      ) : (
        imagePreview && (
          <div>
            <Image
              src={imagePreview}
              alt="Image preview"
              fluid
              style={{ maxWidth: "100%", maxHeight: "450px" }}
            />
            <br />
            <br />
            <Button variant="secondary" onClick={resetFileInput}>
              Cancel
            </Button>
            {"  "}
            <Button variant="primary" onClick={handleUpload}>
              Upload Image
            </Button>
          </div>
        )
      )}
    </div>
  );
};

export default ImageUpload;
