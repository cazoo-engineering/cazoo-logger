import {Transform} from 'stream';
import split = require('split2');

export function sink(raw = false): Transform {
  if (raw) {
    return split();
  }
  return split(JSON.parse);
}

export function once<T>(emitter: NodeJS.EventEmitter): Promise<T> {
  return new Promise((resolve, reject) => {
    emitter.once('error', reject);
    emitter.once('data', d => {
      emitter.removeListener('error', reject);
      resolve(d);
    });
  });
}
