"use client";
import { useScope } from "@primitives/useScope";
import { createPermissionAware } from "./core";

export { createPermissionAware } from "./core";
export type { PermissionAwareOptions as UsePermissionAwareOptions } from "./core";
export type UsePermissionAware = typeof createPermissionAware;

export const usePermissionAware: UsePermissionAware = ({
  isSupported$,
  requestPermission,
  isRequired$,
  queryPermission,
  revalidateOn$,
}) => {
  return useScope(
    (p) =>
      createPermissionAware({
        isSupported$,
        requestPermission: () => (p.requestPermission as typeof requestPermission)(),
        isRequired$,
        queryPermission: queryPermission
          ? () => (p.queryPermission as NonNullable<typeof queryPermission>)()
          : undefined,
        revalidateOn$,
      }),
    { requestPermission, queryPermission }
  );
};
