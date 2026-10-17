import fs from "fs";
import path from "path";
import { openai } from "./config";

interface TranscriptionResult {
  text: string;
  language: string | undefined;
  duration: number | undefined;
}

/**
 * Transcribe a voice message from a customer using Whisper.
 * Support agents can send voice notes; we convert them to text
 * before feeding them into the chat pipeline.
 */
export async function transcribeVoiceMessage(
  audioFilePath: string
): Promise<TranscriptionResult> {
  const absolutePath = path.resolve(audioFilePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Audio file not found: ${absolutePath}`);
  }

  const allowedExtensions = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"];
  const ext = path.extname(absolutePath).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    throw new Error(
      `Unsupported audio format "${ext}". Supported: ${allowedExtensions.join(", ")}`
    );
  }

  const fileSizeBytes = fs.statSync(absolutePath).size;
  const maxSizeBytes = 25 * 1024 * 1024; // 25 MB limit

  if (fileSizeBytes > maxSizeBytes) {
    throw new Error(
      `Audio file too large (${(fileSizeBytes / 1024 / 1024).toFixed(1)} MB). ` +
        `Maximum size is 25 MB.`
    );
  }

  try {
    const fileStream = fs.createReadStream(absolutePath) as any;

    const response = await openai.createTranscription(
      fileStream,
      "whisper-1",
      "Transcribe this customer support voice message accurately.",
      "json",
      0.2,
      "en"
    );

    return {
      text: response.data.text,
      language: (response.data as any).language,
      duration: (response.data as any).duration,
    };
  } catch (error: any) {
    throw new Error(`Voice transcription failed: ${error.message}`);
  }
}

/**
 * Transcribe multiple voice messages in sequence (not parallel,
 * to respect rate limits on the Whisper endpoint).
 */
export async function transcribeBatch(
  audioPaths: string[]
): Promise<TranscriptionResult[]> {
  const results: TranscriptionResult[] = [];

  for (const audioPath of audioPaths) {
    const result = await transcribeVoiceMessage(audioPath);
    results.push(result);
  }

  return results;
}
