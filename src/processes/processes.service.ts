/*
 * @Date: 2023-11-15 09:12:18
 * @LastEditors: bingo 157272494@qq.com
 * @LastEditTime: 2023-11-17 16:59:00
 * @FilePath: /dingtalk-biz/src/processes/processes.service.ts
 */
import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Util, * as $Util from '@alicloud/tea-util';
import dingtalkworkflow_1_0, * as $dingtalkworkflow_1_0 from '@alicloud/dingtalk/workflow_1_0';
import dingtalkoauth2_1_0, * as $dingtalkoauth2_1_0 from '@alicloud/dingtalk/oauth2_1_0';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import * as $tea from '@alicloud/tea-typescript';
import { ConsoleLogger } from '@nestjs/common';
import { Processes } from './processes.entity';

@Injectable()
export class ProcessesService {
  constructor(
    @InjectRepository(Processes)
    private readonly processesRepo: Repository<Processes>, // 使用泛型注入对应类型的存储库实例
  ) {}

  readonly AppKey = 'dingxiahn1pcvrremr67';
  readonly AppSecret =
    't9dMAp8zVDLo7mssLlL69mJffkjTQvJ3Wy-2vTH3kOkChHBxWy_MDW38d2LPP9Fk';
  readonly processCode = 'PROC-3456322B-C373-47D3-98E1-9545BA3E7DD4';

  accessToken: String;
  /**
   * 使用 Token 初始化账号Client
   * @return Client
   * @throws Exception
   */
  static createAuthClient(): dingtalkoauth2_1_0 {
    let config = new $OpenApi.Config({});
    config.protocol = 'https';
    config.regionId = 'central';
    return new dingtalkoauth2_1_0(config);
  }
  /**
   * 使用 Token 初始化账号Client
   * @return Client
   * @throws Exception
   */
  static createWorkflowClient(): dingtalkworkflow_1_0 {
    let config = new $OpenApi.Config({});
    config.protocol = 'https';
    config.regionId = 'central';
    return new dingtalkworkflow_1_0(config);
  }

  async getProcessInstanceIds(
    startTime: number,
    endTime: number,
    statuses: Array<string>,
  ): Promise<Array<any>> {
    // 1. 请求accessToken
    const { accessToken } = await this.requestAccsssToken({
      appKey: this.AppKey,
      appSecret: this.AppSecret,
    });
    this.accessToken = accessToken;

    // 2. 请求审批Id列表
    const { list } = await this.requestProcessInstanceIds({
      processCode: this.processCode,
      startTime: startTime,
      endTime: endTime,
      nextToken: 0,
      maxResults: 20,
      statuses: statuses,
    });
    return list;
  }
  async requestAccsssToken(params: {
    appKey: string;
    appSecret: string;
  }): Promise<{ accessToken: String }> {
    let client = ProcessesService.createAuthClient();
    let getAccessTokenRequest = new $dingtalkoauth2_1_0.GetAccessTokenRequest({
      appKey: params.appKey,
      appSecret: params.appSecret,
    });
    try {
      const res = await client.getAccessToken(getAccessTokenRequest);
      return res.body;
    } catch (err) {
      if (!Util.empty(err.code) && !Util.empty(err.message)) {
        // err 中含有 code 和 message 属性，可帮助开发定位问题
        console.log(`错误信息:${err.message},错误码:${err.code}`);
      }
    }
  }
  async requestProcessInstanceIds(params: {
    processCode: string;
    startTime: number;
    endTime: number;
    nextToken: number;
    maxResults: number;
    statuses: string[];
  }): Promise<any> {
    let client = ProcessesService.createWorkflowClient();
    let listProcessInstanceIdsHeaders =
      new $dingtalkworkflow_1_0.ListProcessInstanceIdsHeaders({});
    listProcessInstanceIdsHeaders.xAcsDingtalkAccessToken = this.accessToken;
    let listProcessInstanceIdsRequest =
      new $dingtalkworkflow_1_0.ListProcessInstanceIdsRequest({
        processCode: params.processCode,
        startTime: params.startTime,
        endTime: params.endTime,
        nextToken: 0,
        maxResults: 20,
        statuses: params.statuses,
        // [
        //   "COMPLETED"
        // ],
      });
    try {
      const res = await client.listProcessInstanceIdsWithOptions(
        listProcessInstanceIdsRequest,
        listProcessInstanceIdsHeaders,
        new $Util.RuntimeOptions({}),
      );
      return res.body.result;
    } catch (err) {
      if (!Util.empty(err.code) && !Util.empty(err.message)) {
        // err 中含有 code 和 message 属性，可帮助开发定位问题
        console.log(`错误信息:${err.message},错误码:${err.code}`);
      }
    }
  }
  async requestProcessInstanceDetail(processInstanceId: string): Promise<void> {
    let client = ProcessesService.createWorkflowClient();
    let getProcessInstanceHeaders =
      new $dingtalkworkflow_1_0.GetProcessInstanceHeaders({});
    getProcessInstanceHeaders.xAcsDingtalkAccessToken = this.accessToken;
    let getProcessInstanceRequest =
      new $dingtalkworkflow_1_0.GetProcessInstanceRequest({
        processInstanceId,
      });
    try {
      const result = await client.getProcessInstanceWithOptions(
        getProcessInstanceRequest,
        getProcessInstanceHeaders,
        new $Util.RuntimeOptions({}),
      );
      return result;
    } catch (err) {
      if (!Util.empty(err.code) && !Util.empty(err.message)) {
        // err 中含有 code 和 message 属性，可帮助开发定位问题
        console.log(`错误信息:${err.message},错误码:${err.code}`);
      }
    }
  }

  /**
   * 创建
   *
   * @param cat Cat 实体对象
   */
  async createCat(processes: Processes): Promise<Processes> {
    /**
     * 创建新的实体实例，并将此对象的所有实体属性复制到新实体中。 请注意，它仅复制实体模型中存在的属性。
     */
    // this.catRepo.create(cat);

    // 插入数据时，删除 id，以避免请求体内传入 id
    delete processes.id;
    return this.processesRepo.save(this.processesRepo.create(processes));

    /**
     * 将给定实体插入数据库。与save方法不同，执行原始操作时不包括级联，关系和其他操作。
     * 执行快速有效的INSERT操作。不检查数据库中是否存在实体，因此如果插入重复实体，本次操作将失败。
     */
    // await this.catRepo.insert(cat);
  }

  /**
   * 删除
   *
   * @param id ID
   */
  async deleteCat(id: number): Promise<void> {
    await this.findOneById(id);
    this.processesRepo.delete(id);
  }

  /**
   * 更新
   *
   * @param cat Cat 实体对象
   */
  async updateCat(id: number, processes: Processes): Promise<void> {
    const existCat = await this.findOneById(id);
    // 当传入空数据时，避免覆盖原数据
    existCat.nickname =
      processes && processes.nickname ? processes.nickname : existCat.nickname;
    existCat.species =
      processes && processes.species ? processes.species : existCat.species;
    this.processesRepo.save(existCat);
  }

  /**
   * 根据ID查询
   *
   * @param id ID
   */
  async findOneCat(id: number): Promise<Processes> {
    return this.findOneById(id);
  }

  /**
   * 根据ID查询单个信息，如果不存在则抛出404异常
   * @param id ID
   */
  private async findOneById(id: number): Promise<Processes> {
    // const catInfo = await this.processesRepo.findOne(id);
    const catInfo = await new Processes();
    if (!catInfo) {
      throw new HttpException(`指定 id=${id} 的猫猫不存在`, 404);
    }
    return catInfo;
  }
}
