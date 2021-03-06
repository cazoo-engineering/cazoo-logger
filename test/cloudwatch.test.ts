import * as logger from '../src';
import {sink} from './helper';
import {event, context} from './data/cloudwatch';

describe('When logging in a cloudwatch event context', () => {
  const results: Array<string> = [];
  const now = Date.now();
  let dateSpy: jest.SpyInstance<number>;

  beforeAll(async () => {
    dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    const stream = sink(true);
    const p = new Promise(resolve => {
      stream.on('data', data => {
        results.push(data);
        if (results.length === 2) resolve(results);
      });
    });

    const log = logger.fromContext(event, context, {stream});
    log.info('Hello world');
    log.info('Hello world');
    await p;
  });

  afterAll(() => {
    dateSpy.mockRestore();
  });

  it('should log the hello world message', () => {
    const result = results[1];
    expect(JSON.parse(result)).toStrictEqual({
      level: 'info',
      context: {
        trigger: 'EventBridge',
        request_id: context.awsRequestId,
        account_id: 'account-id',
        function: {
          name: context.functionName,
          version: context.functionVersion,
          service: 'Unknown',
        },
        event: {
          source: 'aws.events',
          type: 'Scheduled Event',
          id: event.id,
        },
      },
      msg: 'Hello world',
    });
  });

  it('should record a telemetry line', () => {
    const result = results[0];
    expect(result.startsWith('CZEV ')).toBe(true);
  });

  it('should contain the contextual data', () => {
    const result = results[0];
    const data = JSON.parse(result.substr(5));

    expect(data).toStrictEqual({
      ts: now,
      event: {
        id: event.id,
        type: event['detail-type'],
      },
      node: {
        name: context.functionName,
        svc: 'Unknown',
      },
      dir: 'IN',
      req: 'request-id',
    });
  });
});
