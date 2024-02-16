import { BASE_API_URL } from "../constants";
import { Button } from "react-bootstrap";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";

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

const testGetLineage = async (
  callApi: (url: string, options?: RequestInit) => Promise<Response>,
  userId: string | null,
) => {
  const res = await callApi(BASE_API_URL + `/lineages/user/${userId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  console.log(data);
};

export const TestBox = () => {
  const { userId } = useAuth();
  const { callApi } = useApi();
  return (
    <div>
      <h1>Test Box</h1>
      <Button onClick={testCookieGetFromApi}>Set Cookie From API</Button>
      <p></p>
      <Button onClick={testCookieReadFromApi}>Read Cookie From API</Button>
      <p></p>
      <Button onClick={() => testGetLineage(callApi, userId)}>
        Get Lineage
      </Button>
    </div>
  );
};
