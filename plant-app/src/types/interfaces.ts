export interface PlantImage {
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
  location: string | undefined;
  // TODO: figure out how to handle this as list of int
  parent_id: string[] | undefined;
  source: string;
  source_date: string;
  sink: string | undefined;
  sink_date: string | undefined;
  notes: string | undefined;
  user_id: string;
}

export type NewPlant = Partial<Plant>;

export const NewPlantStrForNulls = (plant: NewPlant) => {
  // Needed to make sure that plant form resets properly when editing a plant
  return {
    ...plant,
    species: plant.species || "",
    location: plant.location || "",
    parent_id: plant.parent_id || [],
    sink: plant.sink || "",
    sink_date: plant.sink_date || "",
    notes: plant.notes || "",
  };
};

export interface User {
  email: string;
  google_id: string;
  disabled: boolean;
  n_total_plants: number;
  n_active_plants: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

export interface JwtPayload {
  email: string;
  google_id: string;
  exp: number;
}
