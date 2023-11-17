/*
 * @Date: 2023-11-13 08:20:03
 * @LastEditors: bingo 157272494@qq.com
 * @LastEditTime: 2023-11-17 17:29:35
 * @FilePath: /dingtalk-biz/src/app.controller.ts
 */
import { Controller, Get, Post, Req, Body, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller('/')
export class AppController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly appService: AppService,
  ) {}

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }
}
