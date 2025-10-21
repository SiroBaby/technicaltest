import {
  Injectable,
  ExecutionContext,
  CallHandler,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

interface RateLimitData {
  count: number;
  time: number;
}

const store = new Map<string, RateLimitData>();

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const limit = this.reflector.get<number>('rateLimit', handler) || 30;
    const req = context.switchToHttp().getRequest<{ ip: string }>();
    const key = req.ip + '-' + handler.name;
    const now = Date.now();

    const data: RateLimitData = store.get(key) || { count: 0, time: now };
    if (now - data.time > 60000) {
      data.count = 0;
      data.time = now;
    }
    data.count++;
    store.set(key, data);

    if (data.count > limit) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}
