export interface PlantImage {
  ImageID: string;
  Timestamp: string;
  SignedUrl: string;
}

export interface Plant {
  plant_id: string;
  human_id: number;
  human_name: string;
  species: string | null;
  location: string;
  // TODO: figure out how to handle this as list of int
  parent_id: string[] | null;
  source: string;
  source_date: string;
  sink: string | null;
  sink_date: string | null;
  notes: string | null;
}
