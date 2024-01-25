// TODO: standardize API calls into a function that takes in the endpoint, the method
// and the body of the request, then catches different types of error (like API errors vs javascript errors) and

import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export const useApi = () => {
  const navigate = useNavigate();
  // useCallback is used to memoize the function so that it is not recreated on every render
  const callApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const defaultOptions: RequestInit = {
        credentials: "include",
      };
      const fetchOptions: RequestInit = { ...defaultOptions, ...options };

      try {
        const response = await fetch(endpoint, fetchOptions);
        if (response.status === 401) {
          // Redirect to login page
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
    [navigate],
  );
  return { callApi };
};
