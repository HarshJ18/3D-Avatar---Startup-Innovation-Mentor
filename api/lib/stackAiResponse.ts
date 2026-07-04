type StackAiPayload = Record<string, unknown>;

export function extractStackAiReply(data: StackAiPayload): string {
  const outputs = data.outputs as Record<string, unknown> | undefined;

  const candidate =
    data['out-0'] ??
    outputs?.['out-0'] ??
    data.output ??
    outputs?.output;

  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate;
  }

  if (candidate && typeof candidate === 'object') {
    const nested = candidate as Record<string, unknown>;
    const nestedText = nested.text ?? nested.content ?? nested.message;
    if (typeof nestedText === 'string' && nestedText.trim()) {
      return nestedText;
    }
  }

  return '';
}

export function parseStackAiError(payload: unknown): string {
  if (!payload) {
    return 'Unknown Stack AI error';
  }

  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload) as StackAiPayload;
      return parseStackAiError(parsed);
    } catch {
      return payload;
    }
  }

  if (typeof payload === 'object') {
    const data = payload as StackAiPayload;
    if (typeof data.error === 'string') return data.error;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string') return data.message;
  }

  return 'Unknown Stack AI error';
}
