export interface NewPlantImage {
  image_id: string;
  plant_id: string;
  signed_full_photo_url: string;
  signed_thumbnail_photo_url: string;
  timestamp: string;
}

export interface Plant {
  plant_id: string;
  human_id: number;
  human_name: string;
  species: string | undefined;
  location: string;
  // TODO: figure out how to handle this as list of int
  parent_id: string[] | undefined;
  source: string;
  source_date: string;
  sink: string | undefined;
  sink_date: string | undefined;
  notes: string | undefined;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}
