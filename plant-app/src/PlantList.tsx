import React, {useState, useEffect, JSX} from 'react';


interface Plant {
    PlantID: string;
    HumanName: string;
}

export default function PlantList () : JSX.Element  {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch('http://localhost:8000/plants') // Replace with your API endpoint
            .then(response => response.json())
            .then(data => {
                setPlants(data.message);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return <p>Loading plants...</p>;
    }

    return (
        <div>
            <h2>Plant Data</h2>
            <ul>
                {plants.map(plant => (
                    <li key={plant.PlantID}> {plant.PlantID} - {plant.HumanName} </li>
                ))}
            </ul>
        </div>
    );
};
