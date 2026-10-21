export type ColumnInfo = {
  name: string;
  type: string;
};

// Resposta do POST /api/upload
export type UploadInfo = {
  file_id: string;
  filename: string;
  rows: number;
  columns_count: number;
  columns: ColumnInfo[];
  preview: string[][];
  size_mb: number;
  note: string | null;
};