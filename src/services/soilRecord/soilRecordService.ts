import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import {
  SoilRecord,
  CreateSoilRecordRequest,
  UpdateSoilRecordRequest,
  PresignedUploadRequest,
  PresignedUploadResponse,
} from '../../types/soilRecord/soilRecord';

/**
 * Service Quản lý hồ sơ đất (Soil Records)
 * Đồng bộ theo API Backend thực tế
 */
export const soilRecordService = {

  // ──────────────────────────────────────────────
  // SOIL RECORDS BY FARM
  // ──────────────────────────────────────────────

  /**
   * Lấy danh sách hồ sơ đất theo farm
   * GET /api/v1/soil-records
   */
  async getAllSoilRecordsByFarm(): Promise<ApiResponse<SoilRecord[]>> {
    const response = await axiosInstance.get<ApiResponse<SoilRecord[]>>('/api/v1/soil-records');
    return response.data;
  },

  // ──────────────────────────────────────────────
  // SOIL RECORDS BY PLOT
  // ──────────────────────────────────────────────

  /**
   * Lấy danh sách hồ sơ đất theo plot
   * GET /api/v1/plots/{plotId}/soil-records  
   */
  async getAllSoilRecordsByPlot(plotId: string): Promise<ApiResponse<SoilRecord[]>> {
    const response = await axiosInstance.get<ApiResponse<SoilRecord[]>>(`/api/v1/plots/${plotId}/soil-records`);
    return response.data;
  },

  /**
   * Tạo hồ sơ đất mới
   * POST /api/v1/plots/{plotId}/soil-records
   */
  async createSoilRecord(plotId: string, data: CreateSoilRecordRequest): Promise<ApiResponse<SoilRecord>> {
    const response = await axiosInstance.post<ApiResponse<SoilRecord>>(
      `/api/v1/plots/${plotId}/soil-records`,
      data,
    );
    return response.data;
  },

  /**
   * Cập nhật hồ sơ đất
   * PATCH /api/v1/plots/{plotId}/soil-records/{soilRecordId}
   */
  async updateSoilRecord(
    plotId: string,
    soilRecordId: string,
    data: UpdateSoilRecordRequest,
  ): Promise<ApiResponse<SoilRecord>> {
    const response = await axiosInstance.patch<ApiResponse<SoilRecord>>(
      `/api/v1/plots/${plotId}/soil-records/${soilRecordId}`,
      data,
    );
    return response.data;
  },

  /**
   * Xóa hồ sơ đất (soft delete)
   * DELETE /api/v1/plots/{plotId}/soil-records/{soilRecordId}
   */
  async deleteSoilRecord(plotId: string, soilRecordId: string): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete<ApiResponse<string>>(
      `/api/v1/plots/${plotId}/soil-records/${soilRecordId}`,
    );
    return response.data;
  },


  async getPresignedUrl(data: PresignedUploadRequest): Promise<ApiResponse<PresignedUploadResponse>> {
    const response = await axiosInstance.post<ApiResponse<PresignedUploadResponse>>(
      '/api/v1/storage/presigned-url',
      data,
    );
    return response.data;
  },
};