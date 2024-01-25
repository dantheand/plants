import { BASE_API_URL } from "../constants";
import { Button } from "react-bootstrap";

const testCookieGetFromApi = async () => {
  const res = await fetch(BASE_API_URL + "/testing/set_cookie", {
    method: "GET",
    credentials: "include", // This is important for cookies to be sent and received
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  console.log(data);
};

const testCookieReadFromApi = async () => {
  const res = await fetch(BASE_API_URL + "/testing/get_cookie", {
    method: "GET",
    credentials: "include", // This is important for cookies to be sent and received
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  console.log(data);
};

export const TestBox = () => {
  return (
    <div>
      <h1>Test Box</h1>
      <Button onClick={testCookieGetFromApi}>Set Cookie From API</Button>
      <p></p>
      <Button onClick={testCookieReadFromApi}>Read Cookie From API</Button>
    </div>
  );
};
