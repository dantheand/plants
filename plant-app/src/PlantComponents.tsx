import React, {useState, useEffect, JSX} from 'react';

import { ListGroup } from 'react-bootstrap';

import {BASE_API_URL} from "./constants";
import {Container,  Card, Row, Col, Image, Modal} from "react-bootstrap";

import {useParams, useNavigate, NavigateFunction} from 'react-router-dom';
import {BackButton} from "./commonComponents";

import './timeline.css';


interface Plant {
    PlantID: string;
    HumanName: string;
    Species?: string;
    Location: string;
    ParentID?: string;
    Source: string;
    SourceDate: string;
    Sink?: string;
    SinkDate?: string;
    Notes?: string;
}

interface PlantImage {
    ImageID: string;
    Timestamp: string;
    SignedUrl: string;
}

const handlePlantClick = (plantID: string, navigate: NavigateFunction) => {
    navigate(`/plants/${plantID}`);
};

export function PlantList () : JSX.Element  {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();


    useEffect(() => {
        fetch(`${BASE_API_URL}/plants`)
            .then(response => response.json())
            .then(data => {
                const sortedPlants = data.message.sort((a: Plant, b: Plant) => {
                    return parseInt(a.PlantID) - parseInt(b.PlantID);
                });
                setPlants(sortedPlants);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return <p>Loading plants...</p>;
    }

    return (
        <div>
            <Container className="p-5 mb-4 bg-light rounded-3">
            <h2>All Plants</h2>
            <ul>
                {plants.map(plant => (
                    <ListGroup>
                        <ListGroup.Item key={plant.PlantID} onClick={() => handlePlantClick(plant.PlantID, navigate)}
                                        className="clickable-item">
                            {plant.PlantID} - {plant.HumanName}
                        </ListGroup.Item>
                    </ListGroup>
                ))}
            </ul>
            </Container>
        </div>
    );
};



export function PlantDetails () {
    const { plantId } = useParams<{ plantId: string }>() ;
    const safePlantId = plantId ?? '';
    const navigate = useNavigate();
    // Modal stuff
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);


    // Fetch plant details using plantId or other logic
    const [plant, setPlant] = useState<Plant | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${BASE_API_URL}/plants/${plantId}`)
            .then(response => response.json())
            .then(data => {
                setPlant(data.message);
                setIsLoading(false);
            })
            .catch(error => {
                    setError(error.message);
                    setIsLoading(false);
                });

    }, [plantId]);

    if (isLoading) {
        return <p>Loading plant...</p>;
    }

    if (!plant || error){
        return <p>Plant not found</p>;
    }

    return (

        <Container className="my-4">
            <BackButton />
            {/* Basic Information Section */}
            <Card className="mb-3">
                <Card.Header as="h4">Basic Information</Card.Header>
                <ListGroup variant="flush">
                    <ListGroup.Item >
                        Plant ID: {plant.PlantID || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item>Human Name: {plant.HumanName || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item>Species: {plant.Species || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item>Location: {plant.Location || 'N/A'}</ListGroup.Item>
                </ListGroup>
            </Card>

            {/* Source Information Section */}
            <Card className="mb-3">
                <Card.Header as="h4">Source Information</Card.Header>
                <ListGroup variant="flush">
                    <ListGroup.Item
                        onClick={() => plant.ParentID && handlePlantClick(plant.ParentID, navigate)}
                        className={plant.ParentID ? "clickable-item" : ""}>
                        Parent ID: {plant.ParentID || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item>Source: {plant.Source || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item>Source Date: {plant.SourceDate || 'N/A'}</ListGroup.Item>
                </ListGroup>
            </Card>

            {/* Sink Information Section */}
            <Card className="mb-3">
                <Card.Header as="h4">Sink Information</Card.Header>
                <ListGroup variant="flush">
                    <ListGroup.Item>Sink: {plant.Sink || 'N/A'}</ListGroup.Item>
                    <ListGroup.Item>Sink Date: {plant.SinkDate || 'N/A'}</ListGroup.Item>
                </ListGroup>
            </Card>

            {/* Notes Section */}
            <Card className="mb-3">
                <Card.Header as="h4">Notes</Card.Header>
                <Card.Body>
                    {plant.Notes || 'N/A'}
                </Card.Body>
            </Card>
            {/* Images Section */}
                <PlantImages plant_id={safePlantId}/>
        </Container>
    );
};


export function PlantImages({plant_id}: {plant_id: string}){
    const [plantImages, setPlantImages] = useState<PlantImage[]>([]);

    // Modal Stuff
    const [showModal, setShowModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const handleThumbnailClick = (imageUrl:string) => {
        setSelectedImageUrl(imageUrl);
        setShowModal(true);
    };
    const handleCloseModal = () => setShowModal(false);



    useEffect(() => {
        fetch(`${BASE_API_URL}/plants/${plant_id}/images`)
            .then(response => response.json())
            .then(data => {
                setPlantImages(data.message);
            });
    }, [plant_id]);

    if (!plantImages) return <div>Loading images...</div>;

    return (
        <Card className="mb-3">
            <Card.Header as="h4">Images</Card.Header>
            <Card.Body>
                <PlantImagesTimeline plant_images={plantImages} onThumbnailClick={handleThumbnailClick}/>
            </Card.Body>

            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                  </Modal.Header>
                <Modal.Body>
                    <Image src={selectedImageUrl} alt="Plant" fluid />
                </Modal.Body>
            </Modal>
        </Card>

    )
}

export function PlantImagesTimeline({plant_images, onThumbnailClick}:
                                        {plant_images: PlantImage[], onThumbnailClick: (imageUrl: string) => void}){
    return (
        <Container>
            {plant_images.map((image, index) => (
                <Row key={image.ImageID} className={index % 2 === 0 ? 'timeline-row' : 'timeline-row timeline-row-alternate'}>
                    <Col md={6} className="timeline-date">
                        <p>{image.Timestamp}</p>
                    </Col>
                    <Col md={6} className="timeline-image-col">
                        <Image src={image.SignedUrl} alt={`Plant taken on ${image.Timestamp}`}
                               fluid rounded className="timeline-img clickable-item"
                               onClick={() => onThumbnailClick(image.SignedUrl)}
                        />
                    </Col>
                </Row>
            ))}
        </Container>
    );
}

export function PlantImagesOriginal({plant_images}: {plant_images: PlantImage[]}){
    return(
        <Container>
            <Row>
                {plant_images.map(plant_image => (
                    <Col key={plant_image.Timestamp} sm={12} md={6} lg={4} xl={3}>
                        <PlantImageContainer plant_image={plant_image}/>
                    </Col>
                ))}
            </Row>
        </Container>
        )
}

export function PlantImageContainer({plant_image}: {plant_image: PlantImage}){
    return (
        <Container>
            <Card>
                <h5 className="text-center">{plant_image.Timestamp}</h5>
                <Card.Img variant="top" src={plant_image.SignedUrl} className="img-fluid" alt="Plant"
                           />
            </Card>
        </Container>
    )
}

// function PlantModalonClick({image, show}: {image: PlantImage, show: boolean}){
//     <Modal show={show} onHide={handleClose}>
//         <Modal.Header closeButton>
//           <Modal.Title>Modal heading</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>Woohoo, you are reading this text in a modal!</Modal.Body>
//       </Modal>
//
// }