import React from "react";

import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
export function BackButton() {
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate(-1); // Go back to the previous page
    };

    return (
        <Button variant="secondary" onClick={handleBackClick} className="mb-3">
            &#8592; Back
        </Button>
    );
}
