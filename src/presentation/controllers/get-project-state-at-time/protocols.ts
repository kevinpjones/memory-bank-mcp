import { GetFileAtTimeUseCase, GetFileAtTimeResult } from "../../../domain/usecases/get-project-state-at-time.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface GetFileAtTimeRequest {
  /**
   * The name of the project containing the file.
   */
  projectName: string;

  /**
   * The name of the file to retrieve.
   */
  fileName: string;

  /**
   * ISO 8601 timestamp to get the file content at.
   */
  timestamp: string;
}

/**
 * Response containing the file content at the specified time.
 */
export interface GetFileAtTimeResponse {
  timestamp: string;
  content: string | null;
  exists: boolean;
}

export type {
  Controller,
  GetFileAtTimeUseCase,
  GetFileAtTimeResult,
  Request,
  Response,
  Validator,
};
