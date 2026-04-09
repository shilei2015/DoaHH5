import { post } from './request';
import { API } from './api';
import OSS from 'ali-oss';

/** 部分内嵌 WebView 无 crypto.randomUUID，会导致选图后立即在上传阶段抛错 */
function randomObjectKeySegment(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export interface OSSConfig {
    Bucket: string;
    EndPoint: string; // e.g. "oss-cn-shanghai.aliyuncs.com" or "https://..."
    Host: string;     // e.g. "https://bucket.oss-cn-shanghai.aliyuncs.com"
    Dir: string;
    StsToken: {
        AccessKeyId: string;
        AccessKeySecret: string;
        Expiration: string;
        SecurityToken: string;
    }
}

class OSSUploadService {
    private static instance: OSSUploadService;
    private config: OSSConfig | null = null;
    private client: OSS | null = null;

    private constructor() { }

    public static getInstance(): OSSUploadService {
        if (!OSSUploadService.instance) {
            OSSUploadService.instance = new OSSUploadService();
        }
        return OSSUploadService.instance;
    }

    private async fetchConfig(): Promise<OSSConfig | null> {
        try {
            const res = await post(API.oss_file_upload_token, {});
            if (res.code == "0") {
                this.config = res.data;
                return res.data;
            }
            return null;
        } catch (error) {
            console.error("[OSS] Fetch config failed:", error);
            return null;
        }
    }

    /**
     * Initialize or refresh the OSS Client
     */
    private async initClient(): Promise<boolean> {
        const needsRefresh = !this.config || !this.config.StsToken || 
            (new Date(this.config.StsToken.Expiration).getTime() < Date.now() + 60000);

        if (needsRefresh) {
            await this.fetchConfig();
        }

        if (this.config && this.config.StsToken) {
            // If endpoint starts with http, strip it for the SDK
            let endpoint = this.config.EndPoint.replace(/^https?:\/\//, '');
            
            this.client = new OSS({
                region: endpoint.split('.')[0], // Usually the first part is the region, e.g. oss-cn-shanghai
                endpoint: endpoint,
                accessKeyId: this.config.StsToken.AccessKeyId,
                accessKeySecret: this.config.StsToken.AccessKeySecret,
                stsToken: this.config.StsToken.SecurityToken,
                bucket: this.config.Bucket,
                secure: true,
                refreshSTSToken: async () => {
                   const conf = await this.fetchConfig();
                   return {
                       accessKeyId: conf!.StsToken.AccessKeyId,
                       accessKeySecret: conf!.StsToken.AccessKeySecret,
                       stsToken: conf!.StsToken.SecurityToken
                   };
                }
            });
            return true;
        }
        return false;
    }

    /**
     * Upload Image Blob to OSS using SDK.
     */
    public async uploadImage(blob: Blob, extension: string = 'jpg'): Promise<string> {
        if (!(await this.initClient()) || !this.client || !this.config) {
            throw new Error("OSS Client initialization failed");
        }

        const fileName = `${this.config.Dir}${randomObjectKeySegment()}image.${extension}`;
        
        try {
            const result = await this.client.put(fileName, blob);
            console.log("[OSS] SDK Upload success:", result.url);
            // result.url might be HTTP, we prefer the Host from config
            return `${this.config.Host}/${fileName}`;
        } catch (error) {
            console.error("[OSS] SDK Upload failed:", error);
            throw error;
        }
    }
}

export const ossUploadService = OSSUploadService.getInstance();
