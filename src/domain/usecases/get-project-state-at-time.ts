export interface GetFileAtTimeParams {
  projectName: string;
  fileName: string;
  timestamp: string;
}

export interface GetFileAtTimeResult {
  /** The requested timestamp */
  timestamp: string;
  /** The file content at the specified time, or null if file didn't exist */
  content: string | null;
  /** Whether the file existed at the specified time */
  exists: boolean;
}

export interface GetFileAtTimeUseCase {
  getFileAtTime(params: GetFileAtTimeParams): Promise<GetFileAtTimeResult>;
}
