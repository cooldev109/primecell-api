import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getInfo() {
    return {
      name: 'PrimeCell API',
      version: '1.0.0',
      description: 'AI-powered nutrition and body transformation platform',
      documentation: '/api/docs',
    };
  }
}
