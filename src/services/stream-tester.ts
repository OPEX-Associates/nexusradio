export interface StreamTestResult {
  url: string;
  status: 'success' | 'failed' | 'timeout' | 'cors-blocked';
  responseTime: number;
  error?: string;
  format?: string;
  isHLS?: boolean;
}

export class StreamTester {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  static async testStream(url: string): Promise<StreamTestResult> {
    const startTime = Date.now();
    
    try {
      // First, try a HEAD request to check if the URL is accessible
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'User-Agent': this.USER_AGENT
          }
        });
        
        clearTimeout(timeoutId);
        
        const contentType = response.headers.get('content-type') || '';
        const isHLS = url.includes('.m3u8') || contentType.includes('application/x-mpegURL');
        
        if (response.ok) {
          return {
            url,
            status: 'success',
            responseTime: Date.now() - startTime,
            format: contentType,
            isHLS
          };
        } else {
          return {
            url,
            status: 'failed',
            responseTime: Date.now() - startTime,
            error: `HTTP ${response.status}: ${response.statusText}`,
            isHLS
          };
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          return {
            url,
            status: 'timeout',
            responseTime: Date.now() - startTime,
            error: 'Request timeout'
          };
        }
        
        // If CORS blocked, try audio test
        if (fetchError.message.includes('CORS') || fetchError.name === 'TypeError') {
          return await this.testAudioPlayback(url, startTime);
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      // Fallback to audio playback test
      return await this.testAudioPlayback(url, startTime);
    }
  }

  private static async testAudioPlayback(url: string, startTime: number): Promise<StreamTestResult> {
    return new Promise((resolve) => {
      const audio = new Audio();
      let resolved = false;
      
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        }
      };

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          cleanup();
          resolve({
            url,
            status: 'timeout',
            responseTime: Date.now() - startTime,
            error: 'Audio load timeout'
          });
        }
      }, this.TIMEOUT_MS);

      audio.addEventListener('canplay', () => {
        if (!resolved) {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            url,
            status: 'success',
            responseTime: Date.now() - startTime,
            format: 'audio/*'
          });
        }
      });

      audio.addEventListener('error', () => {
        if (!resolved) {
          clearTimeout(timeoutId);
          cleanup();
          const error = audio.error;
          resolve({
            url,
            status: 'failed',
            responseTime: Date.now() - startTime,
            error: error ? `Audio error: ${error.code} - ${error.message}` : 'Unknown audio error'
          });
        }
      });

      audio.addEventListener('loadstart', () => {
        // Stream started loading, this is a good sign
      });

      // Set crossOrigin to anonymous to handle CORS properly
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
      audio.src = url;
      audio.load();
    });
  }

  static async testMultipleStreams(urls: string[]): Promise<StreamTestResult[]> {
    const promises = urls.map(url => this.testStream(url));
    return Promise.all(promises);
  }

  static async findWorkingStream(urls: string[]): Promise<StreamTestResult | null> {
    for (const url of urls) {
      const result = await this.testStream(url);
      if (result.status === 'success') {
        return result;
      }
    }
    return null;
  }
}