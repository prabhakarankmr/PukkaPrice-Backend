import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private configService: ConfigService) {}

  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV', 'development'),
      version: '1.0.0',
    };
  }
}
