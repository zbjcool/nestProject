/*
 * @Date: 2023-11-13 08:20:03
 * @LastEditors: bingo 157272494@qq.com
 * @LastEditTime: 2023-11-15 17:56:32
 * @FilePath: /dingtalk-biz/src/main.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import "reflect-metadata"

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options = new DocumentBuilder()
    .setTitle('nest项目文档')
    .setDescription('nest API 描述')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
