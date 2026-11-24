export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SurveillanceNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: string;
  metadata?: {
    plate_number?: string;
    camera_id?: string;
    junction_name?: string;
    speed_kmh?: number;
  };
}
