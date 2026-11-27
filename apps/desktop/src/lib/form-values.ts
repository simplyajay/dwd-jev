// Text inputs give "" for empty. Creating treats that as absent; updating sends
// null, so a cleared optional field is actually cleared.
export const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
export const emptyToNull = (value: unknown) => (value === "" ? null : value);
