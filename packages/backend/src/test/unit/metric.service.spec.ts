import { MetricsChannels } from '@graphql-portal/types';
import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { config } from 'node-config-ts';
import { AnyMetric, AnyResolverMetric } from 'src/modules/metric/interfaces';
import AppModule from '../../modules/app.module';
import MetricService from '../../modules/metric/metric.service';

jest.useFakeTimers();

describe('SourceService', () => {
  let app: TestingModule;
  let metricService: MetricService;

  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await Promise.all(mongoose.connections.map((c) => c.db?.dropDatabase()));

    metricService = app.get<MetricService>(MetricService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('init', () => {
    it('should call fetchMetrics after delay time', async () => {
      const spyFetchMetrics = jest.spyOn(metricService as any, 'fetchMetrics').mockImplementation(() => { });

      metricService.init();
      jest.advanceTimersByTime(config.application.metrics.delay)

      expect(spyFetchMetrics).toBeCalledTimes(2);
      expect(spyFetchMetrics).nthCalledWith(1, MetricsChannels.REQUEST_IDS, config.application.metrics.chunk);
      expect(spyFetchMetrics).nthCalledWith(2, MetricsChannels.NETWORK, config.application.metrics.chunk);
    });

    describe('fetchMetrics', () => {
      const chunk = 10;
      const records = [1, 2, 3];


      it('fetchMetrics should call aggregateRequestMetric', async () => {
        const spyGetRecords = jest.spyOn((metricService as any), 'getRecords').mockResolvedValue(records);
        const spyAggregateRequestMetric = jest.spyOn((metricService as any), 'aggregateRequestMetric').mockImplementation();

        await (metricService as any).fetchMetrics(MetricsChannels.REQUEST_IDS, 10);

        expect(spyGetRecords).toBeCalledTimes(1);
        expect(spyGetRecords).toBeCalledWith(MetricsChannels.REQUEST_IDS, chunk);
        expect(spyAggregateRequestMetric).toBeCalledTimes(records.length);
        expect(spyAggregateRequestMetric.mock.calls[0][0]).toBe(records[0]);
        expect(spyAggregateRequestMetric.mock.calls[1][0]).toBe(records[1]);
        expect(spyAggregateRequestMetric.mock.calls[2][0]).toBe(records[2]);
      });

      it('fetchMetrics should call aggregateNetworkMetric', async () => {
        const spyGetRecords = jest.spyOn((metricService as any), 'getRecords').mockResolvedValue(records);
        const spyNetworkMetric = jest.spyOn((metricService as any), 'aggregateNetworkMetric').mockImplementation();

        await (metricService as any).fetchMetrics(MetricsChannels.NETWORK, chunk);

        expect(spyGetRecords).toBeCalledTimes(1);
        expect(spyGetRecords).toBeCalledWith(MetricsChannels.NETWORK, chunk);
        expect(spyNetworkMetric).toBeCalledTimes(records.length);
        expect(spyNetworkMetric.mock.calls[0][0]).toBe(records[0]);
        expect(spyNetworkMetric.mock.calls[1][0]).toBe(records[1]);
        expect(spyNetworkMetric.mock.calls[2][0]).toBe(records[2]);
      });
    });

    it('aggregateNetworkMetric should create network-metric entity', async () => {
      const data = {
        network: {
          bytesIn: 1,
          bytesOut: 2,
          connections: 3,
        },
        date: 4,
        nodeId: 'nodeId',
      }
      const spyCreate = jest.spyOn((metricService as any).networkMetricModel, 'create').mockImplementation();

      await (metricService as any).aggregateNetworkMetric(JSON.stringify(data));

      expect(spyCreate).toBeCalledTimes(1);
      expect(spyCreate).toBeCalledWith({ nodeId: data.nodeId, date: data.date, ...data.network });
    });

    it('aggregateRequestMetric should create request-metric entity', async () => {
      const nodeId = '1.2.3';
      const userAgent = 'userAgent';
      const ip = '1.2.3';
      const query = { query: 'query {a {a}}', variables: {} };
      const request = { smth: 'smth' };
      const rawResponseBody = 'rawResponseBody';
      const contentLength = 'contentLength';
      const requestDate = 1;
      const responseDate = 2;

      const records: AnyMetric[] = [
        {
          event: MetricsChannels.GOT_REQUEST,
          nodeId,
          query,
          userAgent,
          ip,
          request,
          date: requestDate,
        } as any,
        {
          event: MetricsChannels.SENT_RESPONSE,
          rawResponseBody,
          contentLength,
          date: responseDate,
        },
      ]
      const resolvers = [{ path: 'path', latency: 100500 }];

      const spyCreate = jest.spyOn((metricService as any).requestMetricModel, 'create').mockImplementation();
      const spyLrange = jest.spyOn((metricService as any).redis, 'lrange').mockResolvedValue(records.map(r => JSON.stringify(r)));
      const spyReduceResolvers = jest.spyOn((metricService as any), 'reduceResolvers').mockReturnValue(resolvers);

      const requestId = 1;
      await (metricService as any).aggregateRequestMetric(requestId);

      expect(spyLrange).toBeCalledTimes(1);
      expect(spyReduceResolvers).toBeCalledTimes(1);
      expect(spyCreate).toBeCalledTimes(1);
      expect(spyCreate).toBeCalledWith({
        requestId,
        resolvers,
        latency: responseDate - requestDate,
        nodeId,
        query,
        userAgent,
        ip,
        request,
        rawResponseBody,
        contentLength,
        error: null,
        requestDate,
        responseDate,
      })
    });

    it('reduceResolvers', () => {
      const info = { info: 'smth' };
      const args = { args: 'smth' };
      const path = 'a';
      const resolverCalledDate = 1;
      const resolverDoneDate = 2;
      const resolvers: AnyResolverMetric[] = [
        {
          event: MetricsChannels.RESOLVER_CALLED,
          info,
          args,
          path,
          date: resolverCalledDate,
        },
        {
          event: MetricsChannels.RESOLVER_DONE,
          info,
          args,
          path,
          date: resolverDoneDate,
          result: 'b',
        },
        {
          event: MetricsChannels.RESOLVER_ERROR,
          info,
          args,
          path,
          date: 3,
          error: 'error',
        }]

      const result = (metricService as any).reduceResolvers(resolvers);
      expect(result).toMatchObject([
        {
          path,
          latency: resolverDoneDate - resolverCalledDate,
          [MetricsChannels.RESOLVER_CALLED]: resolvers[0],
          [MetricsChannels.RESOLVER_DONE]: resolvers[1],
          [MetricsChannels.RESOLVER_ERROR]: resolvers[2],
        }
      ])
    });
  });
});
