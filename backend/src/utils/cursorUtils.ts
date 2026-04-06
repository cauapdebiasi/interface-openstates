export interface CursorData {
  name: string;
  id: string;
}

export const encodeCursor = (data: CursorData): string => {
  const payload = JSON.stringify(data);
  return Buffer.from(payload).toString('base64');
};

export const decodeCursor = (cursor: string): CursorData => {
  const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
  return JSON.parse(decodedString);
};
