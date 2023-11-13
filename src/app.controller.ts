import { Controller, Get, Post, Req, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('process')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post('list')
  getList(@Body() processDto: { startTime: number, endTime: number }) {
    this.appService.getProcessInstanceIds(
      processDto.startTime,
      processDto.endTime
    );
  }
}

