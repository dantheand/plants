import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export function AuthenticatorComponent(){
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <h1>Hello {user && user.username ? user.username : 'Guest'}</h1>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}