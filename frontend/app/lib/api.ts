/**
 * API Client Layer for SignBridge PK
 * Connects Next.js frontend to FastAPI backend (http://localhost:8000)
 * Handles PSL-to-Urdu video translation.
 */

// URL of your FastAPI Python server
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Defines the structure of the data returned by the backend's /model-info endpoint
export interface BackendModelInfo {
  model_name: string;
  supported_datasets: string[];
  architecture: string;
  exported_format: string;
}

// Main API Wrapper Class
export class SignBridgeAPI {
  private static instance: SignBridgeAPI;
  
  // Cache variables to prevent spamming the backend with health checks
  private isBackendOnline: boolean | null = null;
  private lastHealthCheck = 0;

  // Singleton pattern: ensures we only ever create one instance of this API client
  public static getInstance(): SignBridgeAPI {
    if (!SignBridgeAPI.instance) {
      SignBridgeAPI.instance = new SignBridgeAPI();
    }
    return SignBridgeAPI.instance;
  }

  /**
   * Check if the FastAPI backend is running and reachable.
   * Caches the result for 10 seconds to avoid unnecessary network requests.
   */
  public async checkHealth(): Promise<boolean> {
    const now = Date.now();
    // If we checked within the last 10 seconds, return the cached result
    if (this.isBackendOnline !== null && now - this.lastHealthCheck < 10000) {
      return this.isBackendOnline;
    }

    try {
      // Attempt to ping the base URL with a 3-second timeout
      const res = await fetch(`${BACKEND_URL}/`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      this.isBackendOnline = res.ok;
    } catch {
      // If fetch fails (server down or timeout), mark as offline
      this.isBackendOnline = false;
    }
    this.lastHealthCheck = now;
    return this.isBackendOnline;
  }

  /**
   * Fetch backend model specifications
   */
  public async getModelInfo(): Promise<BackendModelInfo | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/model-info`, {
        method: "GET",
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("[SignBridgeAPI] Could not reach backend /api/model-info:", err);
    }
    return null;
  }


  /**
   * Translate PSL video to Urdu word using the backend GRU model
   */
  public async translatePSLToUrdu(videoBlob: Blob, forceGemini: boolean = false): Promise<{
    id: string;
    confidence: number;
    urdu?: string;
    english?: string;
    gloss?: string;
    tokens?: any[];
    intent?: any;
    source?: string;
    error?: string;
  }> {
    // First, verify the backend is actually running before attempting upload
    const isOnline = await this.checkHealth();
    if (isOnline) {
      try {
        // We must use FormData to send binary files (like Blob/videos) via HTTP POST
        const formData = new FormData();
        formData.append("video", videoBlob, "recording.webm");
        
        // Send the video to the FastAPI translation endpoint
        const endpoint = forceGemini
          ? `${BACKEND_URL}/api/translate/psl-to-urdu?force_gemini=true`
          : `${BACKEND_URL}/api/translate/psl-to-urdu`;

        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        // If successful, parse the JSON response which contains the predicted signs & tokens
        if (res.ok) {
          const backendData = await res.json();
          return {
            id: backendData.id,
            confidence: backendData.confidence,
            urdu: backendData.urdu,
            english: backendData.english,
            gloss: backendData.gloss,
            tokens: backendData.tokens || [],
            intent: backendData.intent || null,
            source: backendData.source || "gru_model",
          };
        } else {
          const errData = await res.json().catch(() => null);
          const errorMessage = errData?.detail || `Server returned ${res.status}`;
          return { id: "none", confidence: 0, tokens: [], error: errorMessage };
        }
      } catch (err: any) {
        console.warn("[SignBridgeAPI] Backend video translation failed:", err);
        return { id: "none", confidence: 0, tokens: [], error: err.message };
      }
    }
    // Return a default "none" response if offline
    return { id: "none", confidence: 0, tokens: [], error: "Backend is offline or unreachable." };
  }

  /**
   * Translates Urdu text into PSL sign tokens and 3D animation metadata
   */
  public async translateUrduToPSL(text: string): Promise<any> {
    const isOnline = await this.checkHealth();
    if (isOnline) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/translate/urdu-to-psl`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Passing a dummy API key to satisfy the new security layer
            "x-api-key": "valid-dev-key"
          },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            modelName: data.model_name,
            modelVersion: data.model_version,
            inputUrdu: data.input_urdu,
            normalizedText: data.normalized_text,
            tokens: data.tokens || [],
            video_url: data.video_url,
            glossSequence: data.gloss_sequence,
            totalDurationMs: data.total_duration_ms,
            modelConfidence: data.model_confidence,
            signCount: data.tokens ? data.tokens.length : 0
          };
        } else {
          console.error("[SignBridgeAPI] Urdu to PSL Translation failed:", await res.text());
        }
      } catch (err) {
        console.warn("[SignBridgeAPI] Backend translation failed:", err);
      }
    }
    
    // Return empty fallback on failure
    return {
      tokens: [],
      modelName: "fallback",
      modelVersion: "v0",
      modelConfidence: 0,
      signCount: 0
    };
  }

  /**
   * Conversational query to SignBot AI assistant (Ethical PSL & App Help)
   */
  public async askSignBot(
    message: string,
    history: Array<{ role: string; text: string }> = []
  ): Promise<{
    answer: string;
    suggestions: string[];
    source: string;
  } | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/signbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, history }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("[SignBridgeAPI] SignBot chat request failed:", err);
    }
    return null;
  }
}

export const signBridgeAPI = SignBridgeAPI.getInstance();
