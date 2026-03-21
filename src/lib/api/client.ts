import { API_CONFIG } from "./config";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 请求拦截器：修改请求参数
 */
function applyRequestInterceptors(endpoint: string, params: Record<string, any> = {}): {
  url: string;
  params: Record<string, any>;
} {
  // 添加平台参数
  const enhancedParams = {
    ...params,
    platform: API_CONFIG.PLATFORM,
  };

  // 构建 URL
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  // 查询字符串
  const queryString = Object.entries(enhancedParams)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return {
    url: queryString ? `${url}?${queryString}` : url,
    params: enhancedParams,
  };
}

/**
 * 响应拦截器：处理返回数据
 */
async function handleResponse<T>(response: Response, showError?: (title: string, message: string) => void): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = JSON.parse(errorText);
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // 如果不是 JSON，使用原始文本
    }

    // 触发错误弹窗（如果可用）
    if (showError) {
      showError("请求失败", errorMsg);
    }

    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data as T;
}

/**
 * 统一的 API 请求函数
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, any>; showError?: (title: string, message: string) => void } = {}
): Promise<T> {
  const { params, showError, ...fetchOptions } = options;

  try {
    const { url } = applyRequestInterceptors(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    return await handleResponse<T>(response, showError);
  } catch (error) {
    // 网络错误处理
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        if (showError) showError("请求超时", "请求时间过长，请稍后重试");
        throw new Error("请求超时");
      }

      if (error.message.includes("Failed to fetch")) {
        if (showError) {
          showError(
            "网络错误",
            "无法连接到服务器，请检查网络连接"
          );
        }
      }
    }

    throw error;
  }
}

/**
 * 便捷方法
 */
export const api = {
  get<T>(endpoint: string, params?: Record<string, any>, showError?: (title: string, message: string) => void): Promise<T> {
    return apiRequest<T>(endpoint, { method: "GET", params, showError });
  },

  post<T>(endpoint: string, body?: any, params?: Record<string, any>, showError?: (title: string, message: string) => void): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      params,
      showError,
    });
  },
};
