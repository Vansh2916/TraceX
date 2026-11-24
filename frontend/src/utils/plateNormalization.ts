/**
 * License Plate Normalization & Search Matching Utility.
 * 
 * Requirements:
 * - 'DL8CAF2381', 'DL 8C AF 2381', and 'dl-8c-af-2381' must all match the same sighting.
 * - Non-alphanumeric characters (spaces, dashes, dots) are stripped and case is normalized.
 * - Text search on vehicle make/model and station/corridor names must remain fully functional.
 */

export const normalizePlate = (plate: string | null | undefined): string => {
  if (!plate) return '';
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

export const matchesVehicleQuery = (
  record: {
    plate: string;
    car_model?: string;
    station_name?: string;
    station_id?: string;
    corridor?: string;
    vehicle_type?: string;
    color?: string;
  },
  query: string
): boolean => {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const normalizedQuery = normalizePlate(trimmed);
  const normalizedPlate = normalizePlate(record.plate);

  // If query matches plate normalized
  if (normalizedQuery.length > 0 && normalizedPlate.includes(normalizedQuery)) {
    return true;
  }

  // Text search on vehicle model, station name, camera ID, corridor
  const lowerQuery = trimmed.toLowerCase();
  if (record.car_model && record.car_model.toLowerCase().includes(lowerQuery)) {
    return true;
  }
  if (record.station_name && record.station_name.toLowerCase().includes(lowerQuery)) {
    return true;
  }
  if (record.station_id && record.station_id.toLowerCase().includes(lowerQuery)) {
    return true;
  }
  if (record.corridor && record.corridor.toLowerCase().includes(lowerQuery)) {
    return true;
  }
  if (record.vehicle_type && record.vehicle_type.toLowerCase().includes(lowerQuery)) {
    return true;
  }
  if (record.color && record.color.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  return false;
};
