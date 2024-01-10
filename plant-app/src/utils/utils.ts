export const convertTimestampToDateString = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US");
};
