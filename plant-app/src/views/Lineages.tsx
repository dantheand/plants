import React, { useEffect, useRef } from "react";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";
import { BASE_API_URL } from "../constants";
import { renderChart } from "../d3/TangledTree";

const getLineageData = async (
  callApi: (url: string, options?: RequestInit) => Promise<Response>,
  userId: string | undefined,
) => {
  if (!userId) {
    console.error("UserID is undefined");
    return null; // Return null explicitly when userId is undefined
  }

  try {
    const res = await callApi(BASE_API_URL + `/lineages/user/${userId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await res.json();
    return data; // Return fetched data
  } catch (error) {
    console.error("Failed to fetch lineage data:", error);
    return null; // Return null in case of error
  }
};

export const TangledTree = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();
  const { callApi } = useApi();

  useEffect(() => {
    const fetchDataAndRenderChart = async () => {
      const data = await getLineageData(callApi, userId); // Await the async function
      if (containerRef.current && data) {
        containerRef.current.innerHTML = renderChart(data, {}); // Call renderChart with the actual data
      }
    };

    fetchDataAndRenderChart();
  }, [callApi, userId]);

  return <div ref={containerRef} />;
};
