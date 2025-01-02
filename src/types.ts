import ordSchema from "ord-schema";

type AnyFunction = (...args: any) => any;

type AsObject<T extends { toObject: AnyFunction }> = ReturnType<T['toObject']>;

export type Dataset = AsObject<typeof ordSchema.Dataset>;
export type Reaction = AsObject<typeof ordSchema.Reaction>;
export type Compound = AsObject<typeof ordSchema.Compound>;
export type ProductCompound = AsObject<typeof ordSchema.ProductCompound>;
export type Identifier = AsObject<typeof ordSchema.CompoundIdentifier>;