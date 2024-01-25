import { useCallback } from "react";
import { JWT_TOKEN_STORAGE } from "../constants";
import useLocalStorageState from "use-local-storage-state";

export const useApi = () => {
  const [storedJwt] = useLocalStorageState<string | null>(JWT_TOKEN_STORAGE);

  // useCallback is used to memoize the function so that it is not recreated on every render
  const callApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const defaultOptions: RequestInit = {
        headers: {
          Authorization: `Bearer ${storedJwt}`,
        },
      };
      const fetchOptions: RequestInit = { ...defaultOptions, ...options };

      try {
        const response = await fetch(endpoint, fetchOptions);
        if (response.status === 401) {
          // Redirect to login page
          // navigate("/login");
          // TODO: figure out why this infinite loops when the credentials error (happens when cookie is deleted)
          return Promise.reject(
            new Error("Unauthorized: please refresh and login again."),
          );
        }
        if (!response.ok) {
          return Promise.reject(new Error("Error: " + response.status));
        }
        console.log(response);
        return response;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    [],
  );
  return { callApi };
};
