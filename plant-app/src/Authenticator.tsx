import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {Alert, Button, Card, Form} from "react-bootstrap";
import {FormEvent, useState} from "react";
import {BASE_API_URL, JWT_TOKEN_STORAGE} from "./constants";
import {useNavigate} from "react-router-dom";

export function AuthenticatorComponent(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            const response = await fetch(BASE_API_URL + '/login');
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Login failed:', errorData.message || `Error: ${response.status}`);
                setErrorMessage('Login failed')
                return; // Early return to prevent further execution in case of an error
            }

            const data = await response.json();
            localStorage.setItem(JWT_TOKEN_STORAGE, data.access_token);
            console.log('Logged in successfully');
            navigate('/plants/');

        } catch (error) {
            console.error(error);
            setErrorMessage('Login failed')
        }

    }
    const handleLogout = () => {
        localStorage.removeItem(JWT_TOKEN_STORAGE);
    };

      return(
          <Card style={{ width: '18rem', padding: '20px', margin: '20px auto' }}>
          <Form onSubmit={handleSubmit}>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            <Form.Group className="mb-3" controlId="formBasicUsername">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="username" placeholder="Enter username" value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
            </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Password" value={password}
                onChange={(event) => setPassword(event.target.value)}
            />
          </Form.Group>
          <Button variant="primary" type="submit" style={{ width: '100%', fontSize: '16px' }}>
            Submit
          </Button>
          </Form>
          <Button onClick={(event) => handleLogout()} variant="secondary" style={{marginTop: '10px'}}>
            Logout
            </Button >
          </Card>

    );
}