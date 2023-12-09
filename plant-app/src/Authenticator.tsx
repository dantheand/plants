import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {Button, Card, Form} from "react-bootstrap";

export function AuthenticatorComponent(){
  return(
      <Card style={{ width: '18rem', padding: '20px', margin: '20px auto' }}>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" placeholder="Enter email" />
        </Form.Group>
      <Form.Group className="mb-3" controlId="formBasicPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control type="password" placeholder="Password" />
      </Form.Group>
      <Button variant="primary" type="submit" style={{ width: '100%', fontSize: '16px' }}>
        Submit
      </Button>
      </Form>
      </Card>

);
}