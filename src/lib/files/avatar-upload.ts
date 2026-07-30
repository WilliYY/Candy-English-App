import {
  ImageManipulator,
  SaveFormat,
} from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 1024;

export type AvatarUploadFile = {
  mimeType: "image/jpeg";
  name: string;
  sizeBytes: number;
  uri: string;
};

export class AvatarUploadError extends Error {}

const activeAvatarTemps = new Set<string>();
let isClearingAvatarTemps = false;
let cleanupEpoch = 0;

export function isValidAvatarUploadMetadata(
  file: Pick<AvatarUploadFile, "mimeType" | "sizeBytes" | "uri">,
) {
  return (
    file.uri.length > 0 &&
    file.mimeType === "image/jpeg" &&
    Number.isInteger(file.sizeBytes) &&
    file.sizeBytes > 0 &&
    file.sizeBytes <= MAX_AVATAR_BYTES
  );
}

function removeFile(uri: string) {
  const file = new File(uri);

  if (file.exists) {
    file.delete();
  }
}

export async function pickAvatarForUpload(): Promise<AvatarUploadFile | null> {
  if (isClearingAvatarTemps) {
    throw new AvatarUploadError(
      "Aguarde a limpeza segura da sessao antes de escolher outra foto.",
    );
  }

  const startedAtEpoch = cleanupEpoch;
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new AvatarUploadError(
      "Permita o acesso as fotos para escolher seu avatar.",
    );
  }

  const selection = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ["images"],
    quality: 1,
  });

  if (selection.canceled) {
    return null;
  }

  const selected = selection.assets[0];

  if (!selected) {
    throw new AvatarUploadError("Nao foi possivel ler a foto selecionada.");
  }

  const context = ImageManipulator.manipulate(selected.uri);
  const longestSide = Math.max(selected.width, selected.height);

  if (longestSide > MAX_AVATAR_DIMENSION) {
    context.resize(
      selected.width >= selected.height
        ? { height: null, width: MAX_AVATAR_DIMENSION }
        : { height: MAX_AVATAR_DIMENSION, width: null },
    );
  }

  const rendered = await context.renderAsync();
  const optimized = await rendered.saveAsync({
    compress: 0.82,
    format: SaveFormat.JPEG,
  });
  const file = new File(optimized.uri);
  const upload = {
    mimeType: "image/jpeg" as const,
    name: "avatar.jpg",
    sizeBytes: file.size,
    uri: file.uri,
  };

  if (!isValidAvatarUploadMetadata(upload)) {
    removeFile(file.uri);
    throw new AvatarUploadError(
      "A foto otimizada precisa ter no maximo 2 MB.",
    );
  }

  if (startedAtEpoch !== cleanupEpoch || isClearingAvatarTemps) {
    removeFile(file.uri);
    throw new AvatarUploadError(
      "A sessao foi encerrada antes do envio da foto.",
    );
  }

  activeAvatarTemps.add(file.uri);
  return upload;
}

export async function removeAvatarUploadTemp(uri: string) {
  activeAvatarTemps.delete(uri);

  try {
    removeFile(uri);
  } catch {
    // The operating system may have already cleared this temporary file.
  }
}

export async function clearAvatarUploadTemps() {
  isClearingAvatarTemps = true;
  cleanupEpoch += 1;

  try {
    const files = [...activeAvatarTemps];
    activeAvatarTemps.clear();

    for (const uri of files) {
      try {
        removeFile(uri);
      } catch {
        // Cleanup is best effort and must never preserve an authenticated session.
      }
    }
  } finally {
    isClearingAvatarTemps = false;
  }
}
