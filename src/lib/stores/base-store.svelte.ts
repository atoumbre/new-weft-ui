import { onDestroy } from 'svelte'

export interface StoreError {
  code: string
  message: string
  timestamp: Date
  retryable: boolean
  originalError?: Error
}

export interface StoreOptions {
  autoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  cacheTTL?: number
}

export abstract class BaseStore {
  loading = $state(false)
  initialized = $state(false)
  error: StoreError | null = $state(null)
  lastFetch: Date | null = $state(null)

  protected options: Required<StoreOptions>
  protected pendingRequests: Map<string, Promise<any>> = new Map()
  protected autoRefreshTimer: ReturnType<typeof setInterval> | undefined

  constructor(options: StoreOptions = {}) {
    this.options = {
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      ...options,
    }
  }

  /**
   * Execute an async operation with consistent error handling and retry logic
   * Includes request deduplication to prevent concurrent duplicate requests
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryable = true,
  ): Promise<T | null> {
    // Check if there's already a pending request for this operation
    const pendingRequest = this.pendingRequests.get(operationName)
    if (pendingRequest) {
      return pendingRequest as Promise<T>
    }

    this.loading = true
    this.clearError()

    const requestPromise = (async () => {
      try {
        const result
          = retryable && this.options.autoRetry
            ? await this.withRetry(operation, this.options.maxRetries, operationName)
            : await operation()

        this.lastFetch = new Date()

        this.initialized = true
        return result
      }
      catch (error) {
        const storeError: StoreError = {
          code: this.getErrorCode(error),
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          timestamp: new Date(),
          retryable: retryable && this.isRetryableError(error),
          originalError: error instanceof Error ? error : undefined,
        }

        this.error = storeError
        console.error(`Store operation failed [${operationName}]:`, storeError)
        return null
      }
      finally {
        this.loading = false
        this.pendingRequests.delete(operationName)
      }
    })()

    this.pendingRequests.set(operationName, requestPromise)
    return requestPromise
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    operationName: string,
  ): Promise<T> {
    let lastError: Error | unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      }
      catch (error) {
        lastError = error

        if (attempt === maxAttempts || !this.isRetryableError(error)) {
          throw error
        }

        const delay = this.options.retryDelay * 2 ** (attempt - 1) // Exponential backoff
        console.warn(
          `Store operation [${operationName}] failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`,
          error,
        )

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Determine if an error should trigger a retry
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors are typically retryable
      if (
        error.message.includes('fetch')
        || error.message.includes('network')
        || error.message.includes('timeout')
      ) {
        return true
      }

      // API rate limits are retryable
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return true
      }
    }

    // HTTP status codes that are retryable
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as any).status
      return status >= 500 || status === 408 || status === 429
    }

    return false
  }

  /**
   * Extract a meaningful error code from various error types
   */
  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('fetch'))
        return 'NETWORK_ERROR'
      if (error.message.includes('timeout'))
        return 'TIMEOUT_ERROR'
      if (error.message.includes('parse') || error.message.includes('JSON'))
        return 'PARSE_ERROR'
    }

    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as any).status
      return `HTTP_${status}`
    }

    return 'UNKNOWN_ERROR'
  }

  /**
   * Clear the current error state
   */
  public clearError(): void {
    this.error = null
  }

  /**
   * Manual retry for the last failed operation
   */
  public abstract retry(): Promise<void>

  /**
   * Check if data is fresh based on TTL
   */
  protected isDataFresh(): boolean {
    if (!this.lastFetch)
      return false
    return Date.now() - this.lastFetch.getTime() < this.options.cacheTTL
  }

  /**
   * Get a human-readable status for debugging
   */
  get status(): string {
    if (this.loading)
      return 'loading'
    if (this.error)
      return `error: ${this.error.code}`
    if (this.lastFetch)
      return `fresh (${new Date(this.lastFetch).toLocaleTimeString()})`
    return 'not loaded'
  }

  /**
   * Start an auto-refresh interval and ensure cleanup on destroy.
   * Subsequent calls replace the existing interval.
   */
  protected startAutoRefresh(fn: () => void | Promise<void>, intervalMs: number): void {
    if (typeof window === 'undefined')
      return

    this.stopAutoRefresh()

    const run = () => {
      try {
        const res = fn()
        if (res && typeof (res as Promise<any>).then === 'function')
          (res as Promise<any>).catch(() => {})
      }
      catch {
        // Swallow errors here; individual operations should handle/report
      }
    }

    this.autoRefreshTimer = setInterval(run, intervalMs)

    // Ensure cleanup when the owning component unmounts
    onDestroy(() => this.stopAutoRefresh())
  }

  /** Stop any running auto-refresh interval. */
  protected stopAutoRefresh(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer)
      this.autoRefreshTimer = undefined
    }
  }
}
