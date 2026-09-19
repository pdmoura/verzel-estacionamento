import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { status: string; docs: string; version: string } {
    return {
      status: 'Estacionamento Rotativo API está rodando!',
      docs: '/docs',
      version: '1.1.0',
    };
  }
}
