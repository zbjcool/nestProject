import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProcessesController } from './processes.controller';
import { Processes } from './processes.entity';
import { ProcessesService } from './processes.service';

@Module({
    imports: [TypeOrmModule.forFeature([Processes])],
    controllers: [ProcessesController],
    providers: [ProcessesService],
    exports: [TypeOrmModule],
})
export class ProcessesModule { }