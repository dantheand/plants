export interface PlantImage {
  ImageID: string;
  Timestamp: string;
  SignedUrl: string;
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
