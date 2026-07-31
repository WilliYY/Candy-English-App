import * as Crypto from "expo-crypto";
import {
  Directory,
  File,
  FileMode,
  Paths,
  type DownloadProgress,
} from "expo-file-system";
import { Platform } from "react-native";

const ASSET_CACHE_DIRECTORY = "protected-learning-assets";
const MAX_ASSET_BYTES = 50 * 1024 * 1024;
const MAX_CACHE_BYTES = 128 * 1024 * 1024;

const supportedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type SupportedMimeType = (typeof supportedMimeTypes)[number];

export type ProtectedLearningAssetMetadata = {
  assetId: string;
  fileName: string;
  mimeType: SupportedMimeType;
  sizeBytes: number;
};

type ProtectedLearningAssetSource = {
  headers: Record<string, string>;
  uri: string;
};

type CacheProtectedLearningAssetInput = ProtectedLearningAssetMetadata & {
  onProgress?: (progress: DownloadProgress) => void;
  source: ProtectedLearningAssetSource;
};

export class ProtectedLearningAssetError extends Error {}

const activeDownloads = new Map<
  string,
  { controller: AbortController; promise: Promise<string> }
>();
let isClearingCache = false;

export function isValidProtectedLearningAssetMetadata(
  metadata: ProtectedLearningAssetMetadata,
) {
  return (
    metadata.assetId.length > 0 &&
    metadata.fileName.length > 0 &&
    supportedMimeTypes.includes(metadata.mimeType) &&
    Number.isInteger(metadata.sizeBytes) &&
    metadata.sizeBytes > 0 &&
    metadata.sizeBytes <= MAX_ASSET_BYTES
  );
}

function getCacheDirectory() {
  return new Directory(Paths.cache, ASSET_CACHE_DIRECTORY);
}

function getExtension(mimeType: SupportedMimeType) {
  if (mimeType === "application/pdf") {
    return ".pdf";
  }

  if (mimeType === "image/png") {
    return ".png";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  return ".jpg";
}

function hasExpectedSignature(file: File, mimeType: SupportedMimeType) {
  const handle = file.open(FileMode.ReadOnly);

  try {
    const bytes = handle.readBytes(12);

    if (mimeType === "application/pdf") {
      return (
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2d
      );
    }

    if (mimeType === "image/png") {
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    }

    if (mimeType === "image/jpeg") {
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    }

    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
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

async function downloadProtectedLearningAsset(
  input: CacheProtectedLearningAssetInput,
  signal: AbortSignal,
) {
  if (Platform.OS === "web") {
    throw new ProtectedLearningAssetError(
      "O material protegido esta disponivel no app para Android e iPhone.",
    );
  }

  if (!isValidProtectedLearningAssetMetadata(input)) {
    throw new ProtectedLearningAssetError(
      "Os dados deste material sao invalidos ou o arquivo excede 50 MB.",
    );
  }

  const cacheKey = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${input.assetId}:${input.mimeType}`,
  );
  const directory = getCacheDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const cachedFile = new File(
    directory,
    `${cacheKey}${getExtension(input.mimeType)}`,
  );

  if (
    cachedFile.exists &&
    cachedFile.size === input.sizeBytes &&
    hasExpectedSignature(cachedFile, input.mimeType)
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
      downloaded.size > MAX_ASSET_BYTES ||
      !hasExpectedSignature(downloaded, input.mimeType)
    ) {
      throw new ProtectedLearningAssetError(
        "O arquivo recebido nao corresponde ao material informado.",
      );
    }

    await downloaded.move(cachedFile, { overwrite: true });
    pruneCache(directory, cachedFile.uri);
    return cachedFile.uri;
  } catch (error) {
    removeFileIfPresent(partialFile);

    if (error instanceof ProtectedLearningAssetError) {
      throw error;
    }

    throw new ProtectedLearningAssetError(
      signal.aborted
        ? "O download do material foi cancelado."
        : "Nao foi possivel baixar este material agora.",
    );
  }
}

export function cacheProtectedLearningAsset(
  input: CacheProtectedLearningAssetInput,
) {
  if (isClearingCache) {
    return Promise.reject(
      new ProtectedLearningAssetError(
        "Aguarde a limpeza dos arquivos protegidos.",
      ),
    );
  }

  const active = activeDownloads.get(input.assetId);

  if (active) {
    return active.promise;
  }

  const controller = new AbortController();
  const promise = downloadProtectedLearningAsset(input, controller.signal).finally(
    () => {
      activeDownloads.delete(input.assetId);
    },
  );
  activeDownloads.set(input.assetId, { controller, promise });

  return promise;
}

export async function clearProtectedLearningAssetCache() {
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
