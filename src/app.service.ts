/*
 * @Date: 2023-11-13 08:20:03
 * @LastEditors: bingo 157272494@qq.com
 * @LastEditTime: 2023-11-13 09:24:59
 * @FilePath: /dingtalk-biz/src/app.service.ts
 */
import { Injectable } from '@nestjs/common';
import Util, * as $Util from '@alicloud/tea-util';
import dingtalkworkflow_1_0, * as $dingtalkworkflow_1_0 from '@alicloud/dingtalk/workflow_1_0';
import dingtalkoauth2_1_0, * as $dingtalkoauth2_1_0 from '@alicloud/dingtalk/oauth2_1_0';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import * as $tea from '@alicloud/tea-typescript';

@Injectable()
export class AppService {
  readonly AppKey = 'dingxiahn1pcvrremr67';
  readonly AppSecret = 't9dMAp8zVDLo7mssLlL69mJffkjTQvJ3Wy-2vTH3kOkChHBxWy_MDW38d2LPP9Fk';
  readonly processCode = '"PROC-AAA6559B-2A1B-4E1E-AC38-2D8A9E6D2C45"';

  accessToken: String
  /**
   * 使用 Token 初始化账号Client
   * @return Client
   * @throws Exception
   */
  static createClient(): dingtalkworkflow_1_0 {
    let config = new $OpenApi.Config({ });
    config.protocol = "https";
    config.regionId = "central";
    return new dingtalkworkflow_1_0(config);
  }
  
  async getProcessInstanceIds(
    startTime: number,
    endTime: number,
  ): Promise<void> {
    // 1. 请求accessToken
    const { accessToken } = await this.requestAccsssToken({
      appKey: this.AppKey,
      appSecret: this.AppSecret,
    })
    this.accessToken = accessToken;

    // 2. 请求审批Id列表
    const result = await this.requestProcessInstanceIds({
      processCode: this.processCode,
      startTime: startTime,
      endTime: endTime,
      nextToken: 0,
      maxResults: 20,
      statuses: [
        "COMPLETED"
      ],
    });
    return result
  }
  async requestAccsssToken(params: { appKey: string, appSecret: string }): Promise<{accessToken: String}> {
    let client = AppService.createClient();
    let getAccessTokenRequest = new $dingtalkoauth2_1_0.GetAccessTokenRequest({
      appKey: params.appKey,
      appSecret: params.appSecret,
    });
    try {
      return await client.getAccessToken(getAccessTokenRequest);
    } catch (err) {
      if (!Util.empty(err.code) && !Util.empty(err.message)) {
        // err 中含有 code 和 message 属性，可帮助开发定位问题
      }

    }    
  }  
  async requestProcessInstanceIds(params: {processCode: string, startTime: number, endTime: number, nextToken: number, maxResults: number, statuses: string[]}): Promise<void> {
    let client = AppService.createClient();
    let listProcessInstanceIdsHeaders = new $dingtalkworkflow_1_0.ListProcessInstanceIdsHeaders({ });
    listProcessInstanceIdsHeaders.xAcsDingtalkAccessToken = this.accessToken;
    let listProcessInstanceIdsRequest = new $dingtalkworkflow_1_0.ListProcessInstanceIdsRequest({
      processCode: params.processCode,
      startTime:params.startTime,
      endTime: params.endTime,
      nextToken: 0,
      maxResults: 20,
      statuses: params.statuses
      // [
      //   "COMPLETED"
      // ],
    });
    try {
      return await client.listProcessInstanceIdsWithOptions(listProcessInstanceIdsRequest, listProcessInstanceIdsHeaders, new $Util.RuntimeOptions({ }));
    } catch (err) {
      if (!Util.empty(err.code) && !Util.empty(err.message)) {
        // err 中含有 code 和 message 属性，可帮助开发定位问题
      }

    }    
  }
  async requestProcessInstanceDetail(processInstanceId: string): Promise<void> {
    let client = AppService.createClient();
    let getProcessInstanceHeaders = new $dingtalkworkflow_1_0.GetProcessInstanceHeaders({ });
    getProcessInstanceHeaders.xAcsDingtalkAccessToken = this.accessToken;
    let getProcessInstanceRequest = new $dingtalkworkflow_1_0.GetProcessInstanceRequest({
      processInstanceId,
    });
    try {
      const result = await client.getProcessInstanceWithOptions(getProcessInstanceRequest, getProcessInstanceHeaders, new $Util.RuntimeOptions({ }));
      return result
    } catch (err) {
      if (!Util.empty(err.code) && !Util.empty(err.message)) {
        // err 中含有 code 和 message 属性，可帮助开发定位问题
      }
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
  
}
