export interface SSEEvent {
  event: 'token' | 'done' | 'error' | 'heartbeat';
  data: Record<string, unknown>;
}

export interface SSECallbacks {
  onToken?: (token: string) => void;
  onDone?: (metadata: Record<string, unknown>) => void;
  onError?: (error: string) => void;
  onAbort?: () => void;
}

export function createSSEClient(
  url: string,
  body: Record<string, unknown>,
  token: string,
  callbacks: SSECallbacks,
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to connect' }));
        callbacks.onError?.(error.error ?? 'Connection failed');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('Streaming not supported');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let currentEvent = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              switch (currentEvent) {
                case 'token':
                  callbacks.onToken?.(data.token as string);
                  break;
                case 'done':
                  callbacks.onDone?.(data);
                  break;
                case 'error':
                  callbacks.onError?.(data.message as string);
                  break;
                case 'heartbeat':
                  // Keep-alive, ignore
                  break;
              }
            } catch {
              // Invalid JSON, skip
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        callbacks.onAbort?.();
      } else {
        callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  })();

  return controller;
}
