import * as Crypto from "expo-crypto";
import {
  Directory,
  File,
  FileMode,
  Paths,
  type DownloadProgress,
} from "expo-file-system";
import { Platform } from "react-native";

const CONTRACT_CACHE_DIRECTORY = "protected-contracts";
const MAX_CONTRACT_BYTES = 8 * 1024 * 1024;
const MAX_CACHE_BYTES = 64 * 1024 * 1024;
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

export type ProtectedContractMetadata = {
  contractId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

type ProtectedContractSource = {
  headers: Record<string, string>;
  uri: string;
};

type CacheProtectedContractInput = ProtectedContractMetadata & {
  onProgress?: (progress: DownloadProgress) => void;
  source: ProtectedContractSource;
};

export class ProtectedContractError extends Error {}

const activeDownloads = new Map<
  string,
  { controller: AbortController; promise: Promise<string> }
>();
let isClearingCache = false;

export function isValidProtectedContractMetadata(
  metadata: ProtectedContractMetadata,
) {
  return (
    metadata.contractId.length > 0 &&
    metadata.fileName.length > 0 &&
    metadata.mimeType === "application/pdf" &&
    Number.isInteger(metadata.sizeBytes) &&
    metadata.sizeBytes > 0 &&
    metadata.sizeBytes <= MAX_CONTRACT_BYTES
  );
}

function getCacheDirectory() {
  return new Directory(Paths.cache, CONTRACT_CACHE_DIRECTORY);
}

function hasPdfSignature(file: File) {
  const handle = file.open(FileMode.ReadOnly);

  try {
    const signature = handle.readBytes(PDF_SIGNATURE.length);
    return PDF_SIGNATURE.every((byte, index) => signature[index] === byte);
  } finally {
    handle.close();
  }
}

function removeFileIfPresent(file: File) {
  if (file.exists) {
    file.delete();
  }
}

function pruneCache(directory: Directory, keepUri: string) {
  const files = directory
    .list()
    .filter((entry): entry is File => entry instanceof File)
    .sort(
      (left, right) =>
        (left.lastModified ?? 0) - (right.lastModified ?? 0),
    );
  let totalBytes = files.reduce((total, file) => total + file.size, 0);

  for (const file of files) {
    if (totalBytes <= MAX_CACHE_BYTES) {
      break;
    }

    if (file.uri !== keepUri) {
      totalBytes -= file.size;
      file.delete();
    }
  }
}

async function downloadProtectedContract(
  input: CacheProtectedContractInput,
  signal: AbortSignal,
) {
  if (Platform.OS === "web") {
    throw new ProtectedContractError(
      "O download protegido está disponível no app para Android e iPhone.",
    );
  }

  if (!isValidProtectedContractMetadata(input)) {
    throw new ProtectedContractError(
      "Os dados deste contrato são inválidos ou o arquivo excede 8 MB.",
    );
  }

  const cacheKey = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input.contractId,
  );
  const directory = getCacheDirectory();
  directory.create({ idempotent: true, intermediates: true });

  const cachedFile = new File(directory, `${cacheKey}.pdf`);

  if (
    cachedFile.exists &&
    cachedFile.size === input.sizeBytes &&
    hasPdfSignature(cachedFile)
  ) {
    return cachedFile.uri;
  }

  removeFileIfPresent(cachedFile);
  const partialFile = new File(directory, `${cacheKey}.part`);
  removeFileIfPresent(partialFile);

  try {
    const downloaded = await File.downloadFileAsync(
      input.source.uri,
      partialFile,
      {
        headers: input.source.headers,
        idempotent: true,
        onProgress: input.onProgress,
        signal,
      },
    );

    if (
      downloaded.size !== input.sizeBytes ||
      downloaded.size > MAX_CONTRACT_BYTES ||
      !hasPdfSignature(downloaded)
    ) {
      throw new ProtectedContractError(
        "O arquivo recebido não corresponde ao contrato informado.",
      );
    }

    await downloaded.move(cachedFile, { overwrite: true });
    pruneCache(directory, cachedFile.uri);
    return cachedFile.uri;
  } catch (error) {
    removeFileIfPresent(partialFile);

    if (error instanceof ProtectedContractError) {
      throw error;
    }

    throw new ProtectedContractError(
      "Não foi possível baixar o contrato. Verifique sua conexão.",
    );
  }
}

export function cacheProtectedContract(input: CacheProtectedContractInput) {
  if (isClearingCache) {
    throw new ProtectedContractError(
      "Aguarde a limpeza segura da sessão antes de baixar novamente.",
    );
  }

  const existing = activeDownloads.get(input.contractId);

  if (existing) {
    return existing.promise;
  }

  const controller = new AbortController();
  const pending = downloadProtectedContract(input, controller.signal).finally(() => {
    activeDownloads.delete(input.contractId);
  });
  activeDownloads.set(input.contractId, { controller, promise: pending });

  return pending;
}

export async function clearProtectedContractCache() {
  if (Platform.OS === "web") {
    return;
  }

  isClearingCache = true;

  try {
    const downloads = [...activeDownloads.values()];

    for (const download of downloads) {
      download.controller.abort();
    }

    await Promise.allSettled(downloads.map((download) => download.promise));
    activeDownloads.clear();

    const directory = getCacheDirectory();
    if (directory.exists) {
      directory.delete();
    }
  } finally {
    isClearingCache = false;
  }
}
