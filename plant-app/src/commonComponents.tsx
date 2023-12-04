import React from "react";

import { Button, Container } from "react-bootstrap";
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


export function ImageComponent ({s3Url}: {s3Url: string}) {
    return (
        <div>
            <Container className="p-5 mb-4 bg-light rounded-3">
                <h3>Timestamp</h3>
                <img src={s3Url} alt="From S3" style={{ width: '100%', height: 'auto' }} />
            </Container>
        </div>
    );
}