/*
 * @Date: 2023-11-15 09:11:34
 * @LastEditors: bingo 157272494@qq.com
 * @LastEditTime: 2023-11-15 17:55:03
 * @FilePath: /dingtalk-biz/src/processes/processes.entity.ts
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Processes {
    /**
     * 自增主键
     */
    @PrimaryGeneratedColumn({
        comment: '自增ID'
    })
    id: number;

    /**
     * 昵称
     */
    @Column({
        comment: '昵称'
    })
    nickname: string;

    /**
     * 品种
     */
    @Column({
        comment: '品种'
    })
    species: string;
}