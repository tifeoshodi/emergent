import '@testing-library/jest-dom/extend-expect';
import { TextEncoder, TextDecoder } from 'util';
import { TransformStream } from 'stream/web';
import { BroadcastChannel } from 'worker_threads';
import 'whatwg-fetch';

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
globalThis.TransformStream = TransformStream;
globalThis.BroadcastChannel = BroadcastChannel;

const { server } = require('./test_utils/server');

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
