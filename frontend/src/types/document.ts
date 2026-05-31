export interface Document {
  id: number;
  title: string;
  filename: string;
  file_type: string;
  created_at: string;
  topic_id?: string | null;
  status: string;
}
