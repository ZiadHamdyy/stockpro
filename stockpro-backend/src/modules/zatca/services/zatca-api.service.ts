import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface ZatcaApiResponse {
  validationResults?: {
    infoMessages?: string[];
    warningMessages?: string[];
    errorMessages?: string[];
  };
  reportingStatus?: string;
  qrSell?: string;
  qrBuy?: string;
  uuid?: string;
}

@Injectable()
export class ZatcaApiService {
  private apiBaseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private environment: string;
  private axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.apiBaseUrl = this.configService.get<string>('ZATCA_API_BASE_URL') || '';
    this.clientId = this.configService.get<string>('ZATCA_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('ZATCA_CLIENT_SECRET') || '';
    this.environment = this.configService.get<string>('ZATCA_ENVIRONMENT') || 'sandbox';

    // Create axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }

  /**
   * Get OAuth access token for ZATCA API
   * @returns Access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      const tokenUrl = `${this.apiBaseUrl}/token`;
      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data.access_token;
    } catch (error: any) {
      throw new HttpException(
        `Failed to get ZATCA access token: ${error.message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Submit invoice to ZATCA API
   * @param signedXml Signed XML string
   * @returns ZATCA API response
   */
  async submitInvoice(signedXml: string): Promise<ZatcaApiResponse> {
    if (!this.apiBaseUrl || !this.clientId || !this.clientSecret) {
      throw new HttpException(
        'ZATCA API credentials are not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Get access token
      const accessToken = await this.getAccessToken();

      // Submit invoice
      const submitUrl = `${this.apiBaseUrl}/invoices`;
      const response = await this.axiosInstance.post(submitUrl, signedXml, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/xml',
        },
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const errorStatus = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        `Failed to submit invoice to ZATCA: ${errorMessage}`,
        errorStatus,
      );
    }
  }

  /**
   * Get invoice status from ZATCA API
   * @param uuid Invoice UUID
   * @returns Invoice status
   */
  async getInvoiceStatus(uuid: string): Promise<ZatcaApiResponse> {
    if (!this.apiBaseUrl || !this.clientId || !this.clientSecret) {
      throw new HttpException(
        'ZATCA API credentials are not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Get access token
      const accessToken = await this.getAccessToken();

      // Get invoice status
      const statusUrl = `${this.apiBaseUrl}/invoices/${uuid}/status`;
      const response = await this.axiosInstance.get(statusUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const errorStatus = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        `Failed to get invoice status from ZATCA: ${errorMessage}`,
        errorStatus,
      );
    }
  }

  /**
   * Validate invoice XML before submission
   * @param signedXml Signed XML string
   * @returns Validation result
   */
  async validateInvoice(signedXml: string): Promise<ZatcaApiResponse> {
    if (!this.apiBaseUrl || !this.clientId || !this.clientSecret) {
      throw new HttpException(
        'ZATCA API credentials are not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Get access token
      const accessToken = await this.getAccessToken();

      // Validate invoice
      const validateUrl = `${this.apiBaseUrl}/invoices/validate`;
      const response = await this.axiosInstance.post(validateUrl, signedXml, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/xml',
        },
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const errorStatus = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        `Failed to validate invoice with ZATCA: ${errorMessage}`,
        errorStatus,
      );
    }
  }

  /**
   * Check if ZATCA API is configured
   * @returns true if configured
   */
  isConfigured(): boolean {
    return !!(
      this.apiBaseUrl &&
      this.clientId &&
      this.clientSecret
    );
  }
}

