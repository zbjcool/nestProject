/*
 * @Date: 2023-11-13 08:20:03
 * @LastEditors: bingo 157272494@qq.com
 * @LastEditTime: 2023-11-16 08:39:19
 * @FilePath: /dingtalk-biz/src/app.service.ts
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  
}
