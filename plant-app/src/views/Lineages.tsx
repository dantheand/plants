import React, { useEffect, useState } from "react";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";
import { BASE_API_URL } from "../constants";
import { TangledTreeVisualization } from "../components/lineages/TangledTree";
import { useParams } from "react-router-dom";
import { BaseLayout } from "../components/Layouts";
import { Card, Spinner, ToastContainer } from "react-bootstrap";
import { NodeToast } from "../components/lineages/NodeToast";
import { NodeData } from "../types/interfaces";

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
  const [data, setData] = useState(null); // State to store fetched data
  const [showNodeToast, setShowNodeToast] = useState(false); // State to control Toast visibilityk
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null); // State to store clicked node info

  const handleNodeClick = (nodeData: NodeData) => {
    setSelectedNode(nodeData); // Customize as needed
    setShowNodeToast(true); // Show the toast
  };

  const toggleShowToast = () => setShowNodeToast(!showNodeToast);

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
    if (!queryID) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const fetchData = async () => {
      const fetchedData = await getLineageData(callApi, queryID);
      if (fetchedData) {
        setData(fetchedData); // Store the fetched data in state
      }
      setIsLoading(false);
    };

    fetchData();
  }, [callApi, queryID]);

  return (
    <BaseLayout>
      <Card className="top-level-card" style={{ height: "100%" }}>
        <Card.Header as="h4">Lineages</Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" className="my-5" />
            </div>
          ) : data ? (
            // Render the visualization component with the fetched data
            <TangledTreeVisualization data={data} clickNode={handleNodeClick} />
          ) : (
            <div>No data available</div>
          )}
        </Card.Body>
      </Card>
      <ToastContainer position={"bottom-center"} className={"mb-3"}>
        {selectedNode && (
          <NodeToast
            data={selectedNode}
            show={showNodeToast}
            onClose={toggleShowToast}
          />
        )}
      </ToastContainer>
    </BaseLayout>
  );
};
