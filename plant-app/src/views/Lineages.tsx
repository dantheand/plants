import React, { useEffect, useState } from "react";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";
import { BASE_API_URL } from "../constants";
import { renderChart } from "../d3/TangledTree";
import { useParams } from "react-router-dom";
import { BaseLayout } from "../components/Layouts";
import { Card, Spinner } from "react-bootstrap";

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
  const [isLoading, setIsLoading] = useState(false); // State to track loading status
  const [svgContent, setSvgContent] = useState(""); // State to store the SVG content

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
    setIsLoading(true); // Start loading

    const fetchDataAndRenderChart = async () => {
      const data = await getLineageData(callApi, queryID); // Await the async function
      if (data) {
        // TODO: this is a bad way of creating an svg, we should be manipulating the DOM directly with d3
        //    but for now we'll just use the existing d3 code to generate the svg and set it as a string
        const svgString = renderChart(data, {});
        setSvgContent(svgString);
        setIsLoading(false);
      } else {
        setIsLoading(false); // Finish loading if there's no data
      }
    };

    if (queryID) {
      fetchDataAndRenderChart();
    } else {
      setIsLoading(false); // Ensure loading is stopped if there's no queryID
    }
  }, [callApi, queryID]);

  return (
    <BaseLayout>
      <Card className="top-level-card">
        <Card.Header as="h4">Lineages</Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" className="my-5" />
            </div>
          ) : (
            <div
              style={{ overflow: "auto" }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
        </Card.Body>
      </Card>
    </BaseLayout>
  );
};
