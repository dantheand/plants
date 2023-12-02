import React, {useState, useEffect, JSX} from 'react';

import { ListGroup } from 'react-bootstrap';

import {BASE_API_URL} from "./constants";
import {Container, Row, Col, Card} from "react-bootstrap";

import {useParams, useNavigate, NavigateFunction} from 'react-router-dom';



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
    const { plantId } = useParams<{ plantId: string }>();
    const navigate = useNavigate();

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
        return <p>Loading plants...</p>;
    }

    if (!plant || error){
        return <p>Plant not found</p>;
    }

    return (
        <Container className="my-4">
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
            <Card>
                <Card.Header as="h4">Notes</Card.Header>
                <Card.Body>
                    {plant.Notes || 'N/A'}
                </Card.Body>
            </Card>
        </Container>
    );
};
