import {
  PatchFileParams,
  PatchFileResult,
  PatchFileUseCase,
} from "../../../src/domain/usecases/patch-file.js";

export class MockPatchFileUseCase implements PatchFileUseCase {
  async patchFile(params: PatchFileParams): Promise<PatchFileResult> {
    return { success: true, content: "patched content" };
  }
}

export const makePatchFileUseCase = (): PatchFileUseCase => {
  return new MockPatchFileUseCase();
};
