import React, { useRef, useState } from "react";
import { Button, Form, Image } from "react-bootstrap";
import { useAlert } from "../context/Alerts";

const ImageUpload = ({ plant_id }: { plant_id: string }) => {
  // This is used to store the image preview as a "data URL" (string)
  const [useCamera, setUseCamera] = useState<boolean>(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const toggleCapture = () => {
    setUseCamera(!useCamera);
  };

  const resetFileInput = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = () => {
    // You would need to implement this function to handle the actual file upload to your server
    showAlert(`Image upload trigger for ${plant_id}`, "warning");
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
      {imagePreview && (
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
      )}
    </div>
  );
};

export default ImageUpload;
