import { useCallback } from "react";
import { useApiErrorStore } from "./error-store";
import { API_CONFIG } from "./config";

/**
 * 客户端 API 钩子 - 支持错误弹窗提示
 */
export function useApiClient() {
  const showError = useApiErrorStore((state) => state.showError);

  const request = useCallback(async <T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, any> } = {}
  ): Promise<T> => {
    const { params, ...fetchOptions } = options;

    // 构建请求 URL
    const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    url.searchParams.append("platform", API_CONFIG.PLATFORM);

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch {
          // 如果不是 JSON，使用原始文本
        }

        showError("请求失败", errorMsg);
        throw new Error(errorMsg);
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          showError("请求超时", "请求时间过长，请稍后重试");
          throw new Error("请求超时");
        }

        if (error.message.includes("Failed to fetch")) {
          showError(
            "网络错误",
            "无法连接到服务器，请检查网络连接"
          );
        }
      }

      throw error;
    }
  }, [showError]);

  const get = useCallback(async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
    return request<T>(endpoint, { method: "GET", params });
  }, [request]);

  const post = useCallback(async <T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> => {
    return request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  }, [request]);

  return { request, get, post };
}
