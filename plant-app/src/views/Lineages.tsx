import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";
import { BASE_API_URL } from "../constants";
import { renderChart } from "../d3/TangledTree";
import { useParams } from "react-router-dom";

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
  const params = useParams<string>();
  const pathSpecifiedId = params.userId;
  const [queryID, setQueryID] = useState<string | undefined>(undefined);

  const containerRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();
  const { callApi } = useApi();

  // Set query ID based on URL path or user ID
  useEffect(() => {
    if (
      pathSpecifiedId === "me" ||
      pathSpecifiedId === undefined ||
      pathSpecifiedId === userId
    ) {
      setQueryID(userId);
    } else {
      setQueryID(pathSpecifiedId);
    }
  }, [pathSpecifiedId, userId]);

  useEffect(() => {
    const fetchDataAndRenderChart = async () => {
      const data = await getLineageData(callApi, queryID); // Await the async function
      if (containerRef.current && data) {
        containerRef.current.innerHTML = renderChart(data, {}); // Call renderChart with the actual data
      }
    };

    fetchDataAndRenderChart();
  }, [callApi, queryID]);

  return <div ref={containerRef} />;
};
