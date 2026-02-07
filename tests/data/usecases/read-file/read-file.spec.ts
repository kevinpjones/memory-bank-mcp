import { beforeEach, describe, expect, test, vi } from "vitest";
import { FileRepository } from "../../../../src/data/protocols/file-repository.js";
import { ProjectRepository } from "../../../../src/data/protocols/project-repository.js";
import { ReadFile } from "../../../../src/data/usecases/read-file/read-file.js";
import { ReadFileParams } from "../../../../src/domain/usecases/read-file.js";
import {
  MockFileRepository,
  MockProjectRepository,
} from "../../mocks/index.js";

describe("ReadFile UseCase", () => {
  let sut: ReadFile;
  let fileRepositoryStub: FileRepository;
  let projectRepositoryStub: ProjectRepository;

  beforeEach(() => {
    fileRepositoryStub = new MockFileRepository();
    projectRepositoryStub = new MockProjectRepository();
    sut = new ReadFile(fileRepositoryStub, projectRepositoryStub);
  });

  test("should call ProjectRepository.projectExists with correct projectName", async () => {
    const projectExistsSpy = vi.spyOn(projectRepositoryStub, "projectExists");
    const params: ReadFileParams = {
      projectName: "project-1",
      fileName: "file1.md",
    };

    await sut.readFile(params);

    expect(projectExistsSpy).toHaveBeenCalledWith("project-1");
  });

  test("should return null if project does not exist", async () => {
    vi.spyOn(projectRepositoryStub, "projectExists").mockResolvedValueOnce(
      false
    );
    const params: ReadFileParams = {
      projectName: "non-existent-project",
      fileName: "file1.md",
    };

    const result = await sut.readFile(params);

    expect(result).toBeNull();
  });

  test("should call FileRepository.loadFile with correct params if project exists", async () => {
    const loadFileSpy = vi.spyOn(fileRepositoryStub, "loadFile");
    const params: ReadFileParams = {
      projectName: "project-1",
      fileName: "file1.md",
    };

    await sut.readFile(params);

    expect(loadFileSpy).toHaveBeenCalledWith("project-1", "file1.md");
  });

  test("should return file content on success", async () => {
    const params: ReadFileParams = {
      projectName: "project-1",
      fileName: "file1.md",
    };

    const content = await sut.readFile(params);

    expect(content).toBe("Content of file1.md");
  });

  test("should return null if file does not exist", async () => {
    vi.spyOn(fileRepositoryStub, "loadFile").mockResolvedValueOnce(null);
    const params: ReadFileParams = {
      projectName: "project-1",
      fileName: "non-existent-file.md",
    };

    const content = await sut.readFile(params);

    expect(content).toBeNull();
  });

  test("should propagate errors if repository throws", async () => {
    const error = new Error("Repository error");
    vi.spyOn(projectRepositoryStub, "projectExists").mockRejectedValueOnce(
      error
    );
    const params: ReadFileParams = {
      projectName: "project-1",
      fileName: "file1.md",
    };

    await expect(sut.readFile(params)).rejects.toThrow(error);
  });
});

describe("ReadFile.readFilePreview", () => {
  let sut: ReadFile;
  let fileRepositoryStub: FileRepository;
  let projectRepositoryStub: ProjectRepository;

  beforeEach(() => {
    fileRepositoryStub = new MockFileRepository();
    projectRepositoryStub = new MockProjectRepository();
    sut = new ReadFile(fileRepositoryStub, projectRepositoryStub);
  });

  test("should call FileRepository.loadFileLines", async () => {
    const loadFileLinesSpy = vi.spyOn(fileRepositoryStub, "loadFileLines");

    await sut.readFilePreview({
      projectName: "project-1",
      fileName: "file1.md",
      maxLines: 10,
    });

    expect(loadFileLinesSpy).toHaveBeenCalledWith("project-1", "file1.md");
  });

  test("should return null if project does not exist", async () => {
    vi.spyOn(projectRepositoryStub, "projectExists").mockResolvedValueOnce(
      false
    );

    const result = await sut.readFilePreview({
      projectName: "non-existent-project",
      fileName: "file1.md",
      maxLines: 10,
    });

    expect(result).toBeNull();
  });

  test("should return preview result on success", async () => {
    const result = await sut.readFilePreview({
      projectName: "project-1",
      fileName: "file1.md",
      maxLines: 10,
    });

    expect(result).not.toBeNull();
    expect(result!.content).toBe("Content of file1.md");
    expect(result!.totalLines).toBe(1);
  });
});

describe("ReadFile.readFilePartial", () => {
  let sut: ReadFile;
  let fileRepositoryStub: FileRepository;
  let projectRepositoryStub: ProjectRepository;

  beforeEach(() => {
    fileRepositoryStub = new MockFileRepository();
    projectRepositoryStub = new MockProjectRepository();
    sut = new ReadFile(fileRepositoryStub, projectRepositoryStub);
  });

  test("should return null if project does not exist", async () => {
    vi.spyOn(projectRepositoryStub, "projectExists").mockResolvedValueOnce(
      false
    );

    const result = await sut.readFilePartial({
      projectName: "non-existent-project",
      fileName: "file1.md",
      startLine: 1,
    });

    expect(result).toBeNull();
  });

  test("should return sliced lines for a range", async () => {
    // Mock a 5-line file
    vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce(
      ["line 1", "line 2", "line 3", "line 4", "line 5"]
    );

    const result = await sut.readFilePartial({
      projectName: "project-1",
      fileName: "file1.md",
      startLine: 2,
      endLine: 4,
    });

    expect(result).not.toBeNull();
    expect(result!.content).toBe("line 2\nline 3\nline 4");
    expect(result!.totalLines).toBe(5);
    expect(result!.startLine).toBe(2);
  });

  test("should apply maxLines constraint", async () => {
    vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce(
      ["line 1", "line 2", "line 3", "line 4", "line 5"]
    );

    const result = await sut.readFilePartial({
      projectName: "project-1",
      fileName: "file1.md",
      startLine: 1,
      maxLines: 3,
    });

    expect(result).not.toBeNull();
    expect(result!.content).toBe("line 1\nline 2\nline 3");
    expect(result!.startLine).toBe(1);
  });

  test("should throw RangeError when startLine exceeds totalLines", async () => {
    vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce(
      ["line 1", "line 2"]
    );

    await expect(
      sut.readFilePartial({
        projectName: "project-1",
        fileName: "file1.md",
        startLine: 100,
      })
    ).rejects.toThrow(RangeError);
  });

  test("should clamp endLine to file bounds", async () => {
    vi.spyOn(fileRepositoryStub, "loadFileLines").mockResolvedValueOnce(
      ["line 1", "line 2", "line 3"]
    );

    const result = await sut.readFilePartial({
      projectName: "project-1",
      fileName: "file1.md",
      startLine: 2,
      endLine: 999,
    });

    expect(result).not.toBeNull();
    expect(result!.content).toBe("line 2\nline 3");
    expect(result!.totalLines).toBe(3);
  });
});
