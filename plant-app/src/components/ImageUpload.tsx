import React, { useRef, useState } from "react";
import { Button, Form, Image, Spinner } from "react-bootstrap";
import { useAlert } from "../context/Alerts";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";

const ImageUpload = ({
  plant_id,
  close_modal,
}: {
  plant_id: string;
  close_modal: () => void;
}) => {
  // This is used to store the image preview as a "data URL" (string)
  const [useCamera, setUseCamera] = useState<boolean>(true);
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

    const formData = new FormData();
    formData.append("image_file", file);
    // TODO: enable timestamp data input
    // formData.append('timestamp', new Date().toISOString());

    try {
      const response = await fetch(
        `${BASE_API_URL}/new_images/plants/${plant_id}`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
          },
          // Include headers for authentication if necessary
        },
      );

      if (response.ok) {
        const result = await response.json();
        close_modal();
        showAlert(`Image uploaded successfully: ${result.message}`, "success");
      } else {
        showAlert("Upload failed", "error");
      }
    } catch (error) {
      showAlert("Network error", "error");
      console.error("Upload error:", error);
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
