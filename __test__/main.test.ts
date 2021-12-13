import { expect, test } from '@jest/globals'

test('hello world', async () => {
  await expect('hello world').toBe('hello world')
})
