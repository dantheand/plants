import React, { useEffect, useState } from "react";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";
import { BASE_API_URL } from "../constants";
import { TangledTreeVisualization } from "../d3/TangledTree";
import { useNavigate, useParams } from "react-router-dom";
import { BaseLayout } from "../components/Layouts";
import { Card, Spinner, Toast, ToastContainer } from "react-bootstrap";

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

interface NodeData {
  id: string;
  node_name: string;
  generation: number;
  plant_id?: string;
  source?: string;
  source_date?: string;
  sink?: string;
}

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
          <NodeDataToast
            data={selectedNode}
            show={showNodeToast}
            onClose={toggleShowToast}
          />
        )}
      </ToastContainer>
    </BaseLayout>
  );
};

interface NodeToastProps {
  data: NodeData;
  show: boolean;
  onClose: () => void;
}

const NodeDataToast: React.FC<NodeToastProps> = ({ data, show, onClose }) => {
  const navigate = useNavigate();

  return (
    <Toast
      show={show}
      onClose={onClose}
      style={{ backgroundColor: "#f8f9fa" }}
      className="text-dark"
    >
      <Toast.Header closeButton={false}>
        <strong className="me-auto">{data.node_name}</strong>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        ></button>
      </Toast.Header>
      <Toast.Body>
        <dl className="row mb-0">
          <dt className="col-sm-3">ID:</dt>
          <dd className="col-sm-9">{data.id}</dd>

          <dt className="col-sm-3">Generation:</dt>
          <dd className="col-sm-9">{data.generation}</dd>

          {data.plant_id && (
            <>
              <dt className="col-sm-3">Plant ID:</dt>
              <dd className="col-sm-9">
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/plants/${data.plant_id}`);
                  }}
                >
                  {data.plant_id}
                </a>
              </dd>
            </>
          )}

          {data.source && (
            <>
              <dt className="col-sm-3">Source:</dt>
              <dd className="col-sm-9">{data.source}</dd>
            </>
          )}

          {data.source_date && (
            <>
              <dt className="col-sm-3">Source Date:</dt>
              <dd className="col-sm-9">{data.source_date}</dd>
            </>
          )}

          {data.sink && (
            <>
              <dt className="col-sm-3">Sink:</dt>
              <dd className="col-sm-9">{data.sink}</dd>
            </>
          )}
        </dl>
      </Toast.Body>
    </Toast>
  );
};
