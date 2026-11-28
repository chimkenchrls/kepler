// Smoke test: proves Jest (via jest-expo) can load the app's TypeScript and React Native code.
import TabLayout from '../app/(tabs)/_layout';
import { Placeholder } from './Placeholder';

test('app modules load under Jest', () => {
  expect(typeof TabLayout).toBe('function');
  expect(typeof Placeholder).toBe('function');
});
