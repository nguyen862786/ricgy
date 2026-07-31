import { createServerFn } from "@tanstack/react-start";

export const verifyQiClubCode = createServerFn()
  .handler(async () => {
    return { discount: 0, qiclub_ref: "mock-ref" };
  });

export const claimQiClubCode = createServerFn()
  .handler(async () => {
    return { success: true };
  });

export const lookupQiClubMember = createServerFn()
  .handler(async () => {
    return null;
  });
