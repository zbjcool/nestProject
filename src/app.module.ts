/*
 * @Date: 2023-11-13 08:20:03
 * @LastEditors: zhengbinjue zhengbinjue@goocan.net
 * @LastEditTime: 2023-11-19 15:34:21
 * @FilePath: /nestProject/src/app.module.ts
 */
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessesModule } from './processes/processes.module';
import { ErrorsInterceptor } from './common/errors.interceptor';
import { join } from 'path';
import ormconfig from '../ormconfig.js';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import UnifyExceptionFilter from './common/uinify-exception.filter';
import logger from './common/logger.middleware';
import { UnifyResponseInterceptor } from './common/unify-response.interceptor';

@Module({
  imports: [
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: 'localhost',
    //   port: 3306,
    //   username: 'root',
    //   password: 'a.123456',
    //   database: 'nest',
    //   entities: [join(__dirname, '**', '*.entity.{ts,js}')],
    //   synchronize: true,
    //   logging: true,
    // }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: '%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.json(),
          ),
        }),
      ],
    }),
    ProcessesModule,
  ],
  // imports: [TypeOrmModule.forRoot(ormconfig), ProcessesModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorsInterceptor,
    },
    // 应用全局过滤器
    {
      provide: APP_FILTER,
      useClass: UnifyExceptionFilter,
    },
    // 应用拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: UnifyResponseInterceptor,
    },
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(logger).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
