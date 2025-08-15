export * from "../../protocols/index.js";
export * from "../../../domain/usecases/delete-file.js";

export interface DeleteRequest {
  projectName: string;
  fileName: string;
}

export interface DeleteResponse {
  success: boolean;
}