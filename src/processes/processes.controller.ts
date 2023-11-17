/*
 * @Date: 2023-11-15 09:10:03
 * @LastEditors: bingo 157272494@qq.com
 * @LastEditTime: 2023-11-17 16:57:52
 * @FilePath: /dingtalk-biz/src/processes/processes.controller.ts
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { Result } from '../common/result.interface';
import { Processes } from './processes.entity';
import { ProcessesService } from './processes.service';

@Controller('processes')
export class ProcessesController {
  constructor(
    @Inject(ProcessesService)
    private readonly processesService: ProcessesService,
  ) {}

  @Post('list')
  // @ApiBody({ type: [processDto] })
  async getList(
    @Body()
    processDto: {
      startTime: number;
      endTime: number;
      statuses: string[];
    },
  ): Promise<Result> {
    const data = await this.processesService.getProcessInstanceIds(
      processDto.startTime,
      processDto.endTime,
      processDto.statuses,
    );
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  @Post()
  async createCat(@Body() processes: Processes): Promise<Result> {
    await this.processesService.createCat(processes);
    return { code: 200, message: '创建成功' };
  }

  @Delete(':id')
  async deleteCat(@Param('id') id: number): Promise<Result> {
    await this.processesService.deleteCat(id);
    return { code: 200, message: '删除成功' };
  }

  @Put(':id')
  async updateCat(
    @Param('id') id: number,
    @Body() processes: Processes,
  ): Promise<Result> {
    await this.processesService.updateCat(id, processes);
    return { code: 200, message: '更新成功' };
  }

  @Get(':id')
  async findOneCat(@Param('id') id: number): Promise<Result> {
    const data = await this.processesService.findOneCat(id);
    return { code: 200, message: '查询成功', data };
  }
}
