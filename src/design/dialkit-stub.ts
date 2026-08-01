// Production stand-in for `dialkit`. See next.config.ts. Never used at runtime —
// `useDials` resolves to the token-default path before this could be reached.
export const useDialKit = () => ({});
export const useDialKitController = () => ({ values: {} });
export const DialRoot = () => null;
export default {};
