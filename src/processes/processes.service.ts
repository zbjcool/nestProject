/*
 * @Date: 2023-11-15 09:12:18
 * @LastEditors: bingo 157272494@qq.com
 * @LastEditTime: 2023-11-20 16:16:23
 * @FilePath: /dingtalk-biz/src/processes/processes.service.ts
 */
import { HttpException, Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { interval, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import Util, * as $Util from '@alicloud/tea-util';
import dingtalkworkflow_1_0, * as $dingtalkworkflow_1_0 from '@alicloud/dingtalk/workflow_1_0';
import dingtalkoauth2_1_0, * as $dingtalkoauth2_1_0 from '@alicloud/dingtalk/oauth2_1_0';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import * as $tea from '@alicloud/tea-typescript';
import { Processes } from './processes.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as qs from 'qs';

@Injectable()
export class ProcessesService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly httpService: HttpService, // @InjectRepository(Processes),
    // private readonly processesRepo: Repository<Processes>, // 使用泛型注入对应类型的存储库实例
  ) {}

  readonly APP_KEY = 'dingwxfdilxqsdji1vor';
  readonly APP_SECRET =
    'rbPSu8OsNY5axyiymLAU0c_fiyQ0PKJ47aeBrRqz45Jw_QORRgEdsafEg4ZzZkZH';
  readonly PROCESS_CODE_MAP = {
    // 合同审核会签单
    contract: 'PROC-43FAC27F-3D83-4E74-B359-A0363406BF6F',
    apply: 'PROC-133F78CA-9ABB-47B2-BEDF-5FF5C8CB611A',
  };
  readonly REMOTE_URL =
    'http://122.225.72.186:22092/archive/services/jaxrs/imports/importFilesForXML';

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
    processType: string,
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
      processCode: this.PROCESS_CODE_MAP[processType],
      startTime: startTime,
      endTime: endTime,
      nextToken: 0,
      maxResults: 20,
      statuses: statuses,
    });

    // 3. 获取每个审批的详情
    const plist = [];
    list.forEach((element) => {
      plist.push(this.requestProcessInstanceDetail(element));
    });
    const values = await Promise.all(plist);

    // 4. 调用医院审批服务
    await this.requestRemoveService(processType, values);
    return values;
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
        this.logger.error(
          '获取token失败,' + `错误信息:${err.message},错误码:${err.code}`,
        );
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
        this.logger.error(
          '获取审批ID列表错误,' + `错误信息:${err.message},错误码:${err.code}`,
        );
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
        this.logger.error(
          '获取审批详情失败,' + `错误信息:${err.message},错误码:${err.code}`,
        );
      }
    }
  }

  async requestRemoveService(
    processType: string,
    datas: Array<any>,
  ): Promise<void> {
    try {
      const xmlData = this.getFilesXml(processType, datas);

      const observable = this.httpService.post(
        this.REMOTE_URL,
        qs.stringify({
          xml: xmlData,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          },
        },
      );
      const res = await firstValueFrom(observable);
      this.logger.info(
        `调用服务成功,传参:${JSON.stringify(xmlData)},数据:${res}`,
      );
      console.log(xmlData);
    } catch (err) {
      this.logger.error(
        '调用服务失败,' + `错误信息:${err.message},错误码:${err.code}`,
      );
    }
  }

  getFilesXml(processType: string, datas: Array<any>): string {
    let filesXml = '';
    // TODO: 发布前删掉
    datas.splice(2);
    for (let i = 0; i < datas.length; i++) {
      let fileXml = '';
      const { businessId, formComponentValues, operationRecords, finishTime } =
        datas[i];
      // 获取表单组件的值
      const formComponentMap = formComponentValues.reduce(
        (accumulator, currentValue) => {
          accumulator[currentValue.id] = currentValue.value || '';
          return accumulator;
        },
        {},
      );
      // 发起人 Id
      const userId =
        operationRecords && operationRecords.length > 0
          ? operationRecords[0].userId
          : '';
      // 拼接单个合同数据
      fileXml = this.getFile(processType, {
        businessId,
        formComponentMap,
        userId,
        finishTime,
      });
      filesXml += fileXml;
    }
    return `
      <FILES> 
      ${filesXml}
      </FILES> 
    `;
  }

  getFile(
    processType: string,
    { formComponentMap, businessId, userId, finishTime },
  ): string {
    const seriesCode = 'DFL';
    const fondsCode = 'JXEY';
    let titleProper = '';
    let fileCode = '';
    let lclx = '';
    const finishDate = new Date(finishTime);
    let yearCode = finishDate.getFullYear();
    let dateOfCreation = `${finishDate.getFullYear()}-${
      finishDate.getMonth() + 1
    }-${finishDate.getDate()}`;
    const auth = '嘉兴市第二医院';
    if (processType === 'contract') {
      // 合同项目名称
      titleProper = formComponentMap['TextField-K2AD4O5B'];
      // 合同编号
      fileCode = formComponentMap['TextField_J1BJTKJ4QAO0'];
      lclx = '嘉兴市第二医院合同审核会签单';
      return `
        <FILE>
          <SERIES_CODE>${seriesCode}</SERIES_CODE>
          <FONDS_CODE>${fondsCode}</FONDS_CODE>
          <FILE_CODE>${fileCode}</FILE_CODE>
          <YEAR_CODE>${yearCode}</YEAR_CODE>
          <DATE_OF_CREATION>${dateOfCreation}</DATE_OF_CREATION>
          <AUTHOR>${auth}</AUTHOR>
          <LCLX>${lclx}</LCLX>
          <TITLE_PROPER>${titleProper}</TITLE_PROPER>
          <FILING_USER>${userId}</FILING_USER>
          <OA_ID>${businessId}</OA_ID>
          <DOWNLOAD_TYPE>URL</DOWNLOAD_TYPE>
          <DOCUMENTS>
          </DOCUMENTS>
        </FILE>
      `;
    } else if (processType === 'apply') {
      // 文件题目
      titleProper = formComponentMap['TextField_D0PSJU86PW80'];
      // 发文编号
      fileCode = formComponentMap['TextField_1A6215FTG4DC0'];
      lclx = formComponentMap['DDSelectField-KDE3WKY7'];
      return `
        <FILE>
          <SERIES_CODE>${seriesCode}</SERIES_CODE>
          <FONDS_CODE>${fondsCode}</FONDS_CODE>
          <FILE_CODE>${fileCode}</FILE_CODE>
          <YEAR_CODE>${yearCode}</YEAR_CODE>
          <DATE_OF_CREATION>${dateOfCreation}</DATE_OF_CREATION>
          <AUTHOR>${auth}</AUTHOR>
          <LCLX>${lclx}</LCLX>
          <TITLE_PROPER>${titleProper}</TITLE_PROPER>
          <FILING_USER>${userId}</FILING_USER>
          <OA_ID>${businessId}</OA_ID>
          <DOWNLOAD_TYPE>URL</DOWNLOAD_TYPE>
          <DOCUMENTS> 
          </DOCUMENTS>
        </FILE>
       `;
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
