export const jestMockCall = (mock: unknown) => {
  return (mock as jest.Mock).mock.calls;
};
