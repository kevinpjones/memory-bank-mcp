import { GetProjectStateAtTimeUseCase } from "../../../domain/usecases/get-project-state-at-time.js";
import { ProjectStateAtTime } from "../../../domain/entities/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
} from "../../protocols/index.js";

export interface GetProjectStateAtTimeRequest {
  /**
   * The name of the project to reconstruct state for.
   */
  projectName: string;

  /**
   * ISO 8601 timestamp to reconstruct the project state at.
   */
  timestamp: string;
}

/**
 * Response containing the reconstructed project state.
 * Files map contains file names to their content at the specified time.
 */
export interface GetProjectStateAtTimeResponse {
  timestamp: string;
  files: Record<string, string>;
}

export type {
  Controller,
  GetProjectStateAtTimeUseCase,
  ProjectStateAtTime,
  Request,
  Response,
  Validator,
};
