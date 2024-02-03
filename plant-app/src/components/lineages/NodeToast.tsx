import React from "react";
import { useNavigate } from "react-router-dom";
import { Toast } from "react-bootstrap";
import {
  FaCalendarAlt,
  FaHashtag,
  FaSeedling,
  FaShoppingBag,
  FaSitemap,
} from "react-icons/fa";
import { NodeData } from "../../types/interfaces";

interface NodeToastProps {
  data: NodeData;
  show: boolean;
  onClose: () => void;
}

export const NodeToast: React.FC<NodeToastProps> = ({
  data,
  show,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <Toast show={show} onClose={onClose} className={"lineage-toast"}>
      <Toast.Header closeButton={true} className="lineage-toast-header">
        <strong className="me-auto">{data.node_name}</strong>
      </Toast.Header>
      <Toast.Body className="lineage-toast-body">
        <ul className="list-unstyled mb-0">
          {/*Only show ID if its a plant (otherwise ID is just the name of the source/sink */}
          {data.plant_id && (
            <li>
              <FaHashtag /> <strong>ID:</strong> {data.id}
            </li>
          )}
          <li>
            <FaSitemap /> <strong>Generation:</strong> {data.generation}
          </li>
          {data.plant_id && (
            <li>
              <FaSeedling /> <strong>Plant Details: </strong>
              <a
                href="#/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/plants/${data.plant_id}`);
                }}
              >
                {"link"}
              </a>
            </li>
          )}
          {data.source && (
            <li>
              <FaShoppingBag /> <strong>Source:</strong> {data.source}
            </li>
          )}
          {data.source_date && (
            <li>
              <FaCalendarAlt /> <strong>Source Date:</strong> {data.source_date}
            </li>
          )}
          {data.sink && (
            <li>
              <strong>Sink:</strong> {data.sink}
            </li>
          )}
        </ul>
      </Toast.Body>
    </Toast>
  );
};
