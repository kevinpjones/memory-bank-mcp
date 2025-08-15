import {
  DeleteFileParams,
  DeleteFileUseCase,
  FileRepository,
  ProjectRepository,
} from "./delete-file-protocols.js";

export class DeleteFile implements DeleteFileUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async deleteFile(params: DeleteFileParams): Promise<boolean> {
    const { projectName, fileName } = params;

    const projectExists = await this.projectRepository.projectExists(
      projectName
    );
    if (!projectExists) {
      return false;
    }

    return await this.fileRepository.deleteFile(projectName, fileName);
  }
}