export interface DeleteFileParams {
  projectName: string;
  fileName: string;
}

export interface DeleteFileUseCase {
  deleteFile(params: DeleteFileParams): Promise<boolean>;
}