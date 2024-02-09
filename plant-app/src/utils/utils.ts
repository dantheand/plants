import { formatDistanceToNow } from "date-fns";

export const convertTimestampToDateString = (timestamp: string) => {
  const utcTimestamp = timestamp + "Z"; // Append 'Z' to indicate UTC
  const date = new Date(utcTimestamp);
  return date.toLocaleDateString("en-US");
};

export const timeAgoFromTimestamp = (timestamp: string) => {
  const utcTimestamp = timestamp + "Z"; // Append 'Z' to indicate UTC
  const date = new Date(utcTimestamp);
  return formatDistanceToNow(date, { addSuffix: true });
};
