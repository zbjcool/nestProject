/*
 * @Date: 2023-11-15 09:12:18
 * @LastEditors: zhengbinjue zhengbinjue@goocan.net
 * @LastEditTime: 2023-11-19 20:42:41
 * @FilePath: /nestProject/src/processes/processes.service.ts
 */
import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { interval, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
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
    private readonly httpService: HttpService,
    // @InjectRepository(Processes),
    // private readonly processesRepo: Repository<Processes>, // 使用泛型注入对应类型的存储库实例
  ) {}

  readonly APP_KEY = 'dingwxfdilxqsdji1vor';
  readonly APP_SECRET =
    'rbPSu8OsNY5axyiymLAU0c_fiyQ0PKJ47aeBrRqz45Jw_QORRgEdsafEg4ZzZkZH';
  readonly PROCESS_CODE = 'PROC-43FAC27F-3D83-4E74-B359-A0363406BF6F';
  readonly REMOTE_URL = 'http://122.225.72.186:22092/archive/services/jaxrs/imports'

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
      appKey: this.APP_KEY,
      appSecret: this.APP_SECRET,
    });
    this.accessToken = accessToken;

    // 2. 请求审批Id列表
    const { list } = await this.requestProcessInstanceIds({
      processCode: this.PROCESS_CODE,
      startTime: startTime,
      endTime: endTime,
      nextToken: 0,
      maxResults: 20,
      statuses: statuses,
    });

    list.splice(1)

    // 3. 获取每个审批的详情
    const plist  = []
    list.forEach(element => {
      plist.push(this.requestProcessInstanceDetail(element))
    });
    const values = await Promise.all(plist)

    const result = []
    const _this = this
    async function test() {
      for (let i = 0; i < values.length; i++) {
        const value = values[i]
        const res = await _this.requestRemoveService(value)
        result.push(res)
        console.log(res)
      }
    }
    await test()

    return result;
  }
  /**
   * 请求 token
   * @param params object
   */
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
  /**
   * 请求审批 id 列表
   * @param {Object} params
   * @param {Array} params.statuses 
   *  status:
   *   NEW：新创建
   *   RUNNING：审批中
   *   TERMINATED：被终止
   *   COMPLETED：完成
   *   CANCELED：取消
   */
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

  /**
   * 请求审批实例详情
   * @param processInstanceId 审批实例 id
   */
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
      const res = await client.getProcessInstanceWithOptions(
        getProcessInstanceRequest,
        getProcessInstanceHeaders,
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

  async requestRemoveService(data: any): Promise<void> {
    const formComponentMap = data.formComponentValues.reduce((accumulator, currentValue) => {
      accumulator[currentValue.id] = currentValue
      return accumulator
      },{},
    );
    // 发起人 Id
    const userId = data.operationRecords && data.operationRecords.length > 0 ? data.operationRecords[0].userId : '';
    console.log(formComponentMap)
    // 5. 拼接数据
    let xmlData = `
      <FILES> 
      <FILE> 
        <!--分类号，必传项-->
          <SERIES_CODE>DFL</SERIES_CODE>
        <!--全宗，必传项-->
        <FONDS_CODE>JXRY</FONDS_CODE>
        <!--合同编号-->
        <FILE_CODE>${formComponentMap["TextField_J1BJTKJ4QAO0"].value}</FILE_CODE>
        <YEAR_CODE >2023</YEAR_CODE>
        <!--落款时间-->
        <DATE_OF_CREATION>2023-11-01</DATE_OF_CREATION>
        <!--正文落款单位-->
        <AUTHOR>正文落款单位</AUTHOR>
        <!--流程类型-->
        <LCLX>发文类型</LCLX>
        <TITLE_PROPER>${data.title}</TITLE_PROPER>
        <!—发起人ID，必传项-->
        <FILING_USER>${userId}</FILING_USER>
        <OA_ID>${data.businessId}</OA_ID>
        <!--电子全文导入方式，URL 必传项-->
        <DOWNLOAD_TYPE>URL</DOWNLOAD_TYPE>
      </FILE>
      </FILES>
    `


    // const axiosInstance = this.httpService.axiosRef;
    // axiosInstance.interceptors.request.use(function (config) {
    //   return config;
    // }, null, { synchronous: true });
    // 4. 调用医院审批服务
    let result
    try {
      const observable = this.httpService.post(this.REMOTE_URL, xmlData, {
          headers: {
            'Content-Type': 'text/xml'
          },
      })
      result = await firstValueFrom(observable);
      return result;
    } catch (err) {
      console.log(err)
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
    // return this.processesRepo.save(this.processesRepo.create(processes));
    return;

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
    // this.processesRepo.delete(id);
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
    // this.processesRepo.save(existCat);
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
