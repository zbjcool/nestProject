/*
 * @Date: 2023-11-18 18:46:38
 * @LastEditors: zhengbinjue zhengbinjue@goocan.net
 * @LastEditTime: 2023-11-19 15:29:32
 * @FilePath: /nestProject/src/processes/processes.module.ts
 */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessesController } from './processes.controller';
import { Processes } from './processes.entity';
import { ProcessesService } from './processes.service';

@Module({
    imports: [HttpModule],
    // imports: [TypeOrmModule.forFeature([Processes])],
    controllers: [ProcessesController],
    providers: [ProcessesService],
    // exports: [TypeOrmModule],
})
export class ProcessesModule { }