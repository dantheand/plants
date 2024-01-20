import { PlantImage } from "../../types/interfaces";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { convertTimestampToDateString } from "../../utils/utils";
import React from "react";

export function PlantImagesTimeline({
  plant_images,
  onImageClick,
}: {
  plant_images: PlantImage[];
  onImageClick: (image: PlantImage) => void;
}) {
  // Reorder plants in reverse chronological order
  plant_images.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <VerticalTimeline className="verticalTimeline">
      {plant_images.map((plant_image) => (
        <VerticalTimelineElement
          key={plant_image.timestamp}
          date={convertTimestampToDateString(plant_image.timestamp)}
          className="verticalTimelineElement"
        >
          <div className="timelineElementContent">
            <img
              src={plant_image.signed_thumbnail_photo_url}
              alt={`Plant taken on ${plant_image.timestamp}`}
              className="img-fluid timelineImage clickable-item"
              onClick={() => onImageClick(plant_image)}
            />
          </div>
        </VerticalTimelineElement>
      ))}
    </VerticalTimeline>
  );
}
