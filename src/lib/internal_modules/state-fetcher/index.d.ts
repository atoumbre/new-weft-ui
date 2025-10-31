import { GatewayApiClient, StateApi, LedgerStateSelector, ProgrammaticScryptoSborValue, FungibleResourcesCollection, NonFungibleResourcesCollection, ProgrammaticScryptoSborValueEnum, StateEntityDetailsResponseFungibleResourceDetails, StateEntityDetailsResponseNonFungibleResourceDetails, StateEntityDetailsResponseItemDetails } from '@radixdlt/babylon-gateway-api-sdk';
import Decimal from 'decimal.js';

declare const optionTransformPlugin: EnumTransformerPlugin;
declare class EntityStateFetcher {
    gatewayApi: GatewayApiClient;
    apiCallCount: number;
    private options;
    private enumPlugins;
    private tuplePlugins;
    private resourceStateCache;
    constructor(gatewayApi: GatewayApiClient, { enumPlugins, tuplePlugins, options }?: {
        options?: FetchOptions;
        enumPlugins?: EnumTransformerPlugin | EnumTransformerPlugin[];
        tuplePlugins?: TupleTransformerPlugin | TupleTransformerPlugin[];
    });
    get stateApi(): StateApi;
    static newBaseState<T = any>($entityAddress: string, stateFetcher: EntityStateFetcher): BaseEntityState<T>;
    addPlugins({ enumPlugins, tuplePlugins }: {
        enumPlugins?: EnumTransformerPlugin | EnumTransformerPlugin[];
        tuplePlugins?: TupleTransformerPlugin | TupleTransformerPlugin[];
    }): void;
    addEnumPlugin(plugin: EnumTransformerPlugin | EnumTransformerPlugin[]): void;
    addTuplePlugin(plugin: TupleTransformerPlugin | TupleTransformerPlugin[]): void;
    setOptions(options: FetchOptions): void;
    fetchEntityState<T = any>(entityAddressesInput: string[], localFetchOptions?: Partial<FetchOptions>): Promise<BaseEntityState<T>[]>;
    fetchNftData<T = any>(nonFungibleResourceAddress: string, nonFungibleLocalIds: string[], fetchOptions?: {
        loadLocations?: boolean;
        ledgerStateSelector?: LedgerStateSelector;
    }): Promise<BaseNonFungibleData<T>[]>;
    fetchResourceState(entityAddressesInput: string[], fetchOptions?: {
        ledgerStateSelector?: LedgerStateSelector;
    }): Promise<ResourceState[]>;
    fetchField(field: ProgrammaticScryptoSborValue | undefined): any;
}

interface FungibleVaultState {
    resourceAddress: string;
    amount: Decimal;
}
type FungibleResourceCollectionItem = {
    amount: Decimal;
    fungibleDetails?: FungibleResourceState;
} & ({
    aggregationLevel: 'Global';
} | {
    aggregationLevel: 'Vault';
    vaults: Record<string, FungibleVaultState>;
});
declare class FungibleResourceCollectionState {
    entity: string;
    values: Record<string, FungibleResourceCollectionItem>;
    private initialized;
    private stateFetcher;
    private cursor;
    constructor(entity: string, stateFetcher: EntityStateFetcher);
    get hasMore(): boolean;
    get isInitialized(): boolean;
    private reset;
    init({ aggregationLevel, ledgerStateSelector, recursive }: {
        aggregationLevel?: 'Global' | 'Vault';
        ledgerStateSelector?: LedgerStateSelector;
        recursive?: boolean;
    }): Promise<void>;
    setInitialValues({ initialValues }: {
        initialValues: {
            fungible_resources: FungibleResourcesCollection | undefined;
            state_version: number;
        };
    }): void;
    loadMore(recursive?: boolean): Promise<void>;
    getVaultState(vaultAddress: string): FungibleVaultState | undefined;
    private loadValues;
    private parseValues;
}

type NonFungibleResourceCollectionItem = {
    totalCount: number;
    ids?: string[];
    nonFungibleDetails?: NonFungibleResourceState;
} & ({
    aggregationLevel: 'Global';
} | {
    aggregationLevel: 'Vault';
    vaults: Record<string, NonFungibleVaultState>;
});
interface NonFungibleVaultState {
    resourceAddress: string;
    totalCount: number;
    ids: string[];
}
declare class NonFungibleResourceCollectionState {
    entity: string;
    values: Record<string, NonFungibleResourceCollectionItem>;
    private initialized;
    private stateFetcher;
    private cursor;
    constructor(entity: string, stateFetcher: EntityStateFetcher);
    get hasMore(): boolean;
    get isInitialized(): boolean;
    private reset;
    init({ aggregationLevel, ledgerStateSelector, recursive }: {
        aggregationLevel?: 'Global' | 'Vault';
        ledgerStateSelector?: LedgerStateSelector;
        recursive?: boolean;
    }): Promise<void>;
    setInitialValues({ initialValues }: {
        initialValues: {
            non_fungible_resources: NonFungibleResourcesCollection | undefined;
            state_version: number;
        };
    }): Promise<void>;
    loadMore(recursive?: boolean): Promise<void>;
    getVaultState(vaultAddress: string): NonFungibleVaultState | undefined;
    loadValues({ aggregationLevel, recursive, ledgerStateSelector }: {
        aggregationLevel?: 'Global' | 'Vault';
        ledgerStateSelector?: LedgerStateSelector;
        recursive?: boolean;
    }): Promise<void>;
    private parseValues;
}

type FungibleResourceState = {
    $entityAddress: string;
    $metadata: Record<string, string>;
} & {
    $type: 'FungibleResource';
    $details: StateEntityDetailsResponseFungibleResourceDetails;
};
type NonFungibleResourceState = {
    $entityAddress: string;
    $metadata: Record<string, string>;
} & {
    $type: 'NonFungibleResource';
    $details: StateEntityDetailsResponseNonFungibleResourceDetails;
};
type ResourceState = FungibleResourceState | NonFungibleResourceState;
interface BaseEntityState<T = any> {
    $entityAddress: string;
    $fungibleResources: FungibleResourceCollectionState;
    $nonFungibleResources: NonFungibleResourceCollectionState;
    $metadata: Record<string, string>;
    $state?: T;
    initialized: boolean;
}
interface BaseNonFungibleData<T = any> {
    $entityAddress: string;
    $nonFungibleId: string;
    $owningVault?: string;
    $owningVaultParent?: string;
    $owningVaultAncestor?: string;
    $data?: T;
}
interface FetchOptions {
    loadState: boolean;
    loadResourceDetails: boolean;
    recursiveFungibleResourceLoading: boolean;
    recursiveNonFungibleResourceLoading: boolean;
    ledgerStateSelector?: LedgerStateSelector;
}
interface EnumTransformerPlugin<T = any> {
    enumName: string[];
    parser: (field: {
        kind: 'Enum';
    } & ProgrammaticScryptoSborValueEnum, fetcher: EntityStateFetcher) => T;
}
interface TupleTransformerPlugin<T = any, I = any> {
    tupleName: string;
    parser: (field: I, fetcher: EntityStateFetcher) => T;
}

declare class BaseModel {
    protected stateFetcher: EntityStateFetcher;
    constructor(stateFetcher?: EntityStateFetcher);
}
declare class EntityStateModel<T = any> extends BaseModel {
    innerState: BaseEntityState<T>;
    initialized: boolean;
    constructor(entityAddress: string, stateFetcher?: EntityStateFetcher);
    init(): Promise<void>;
    get state(): T;
}
declare class NonFungibleDataModel<T = any> extends BaseModel {
    innerData: BaseNonFungibleData<T>;
    initialized: boolean;
    constructor(entityAddress: string, nonFungibleId: string, stateFetcher?: EntityStateFetcher);
    init(): Promise<void>;
    get data(): T;
}
declare class ResourceDetailsRepo extends BaseModel {
    ledgerStateSelector?: LedgerStateSelector;
    resources: Record<string, ResourceState>;
    constructor(stateFetcher?: EntityStateFetcher, ledgerStateSelector?: LedgerStateSelector);
    fetchResourceState(entityAddressesInput: string[]): Promise<void>;
}

type A = StateEntityDetailsResponseItemDetails & {
    type: 'FungibleResource' | 'NonFungibleResource';
    resourceAddress: string;
    metadata: Record<string, any>;
    validatorMetadata?: Record<string, any> | undefined;
};
declare class MetadataService extends BaseModel {
    private resourceInfoState;
    private cacheStrategy;
    private validatorMetadataCache;
    constructor(stateFetcher: EntityStateFetcher, useLocalStorage?: boolean, ttlMs?: number);
    getResourceDetails(resources: string[], ledgerStateSelector?: LedgerStateSelector): Promise<A[]>;
    /**
     * Get a single resource from cache or state
     */
    getResourceFromCache(resourceAddress: string): A | undefined;
    /**
     * Clear all cached resources and validator metadata
     */
    clearCache(): void;
    /**
     * Get all resources from state
     */
    getAllResourcesFromState(): A[];
}

declare class ComponentState<T = any> {
    entity: string;
    stateFetcher: EntityStateFetcher;
    state: T | undefined;
    initialized: boolean;
    constructor(entity: string, stateFetcher: EntityStateFetcher);
    init(ledgerStateSelector?: LedgerStateSelector): Promise<void>;
}

declare class KeyValueStore<K extends string, V = any> {
    values: Record<K, V>;
    get hasMore(): boolean;
    get isInitialized(): boolean;
    private storeAddress;
    private initialized;
    private defaultValue?;
    private stateFetcher;
    private cursor;
    constructor(storeAddress: string, stateFetcher: EntityStateFetcher, defaultValue?: V);
    init(ledgerStateSelector?: LedgerStateSelector): Promise<void>;
    loadMore(): Promise<void>;
    getValue(key: K): V | undefined;
    setDefaultValue(value: V): void;
    private loadValues;
}

declare const dec: (input: any) => Decimal;
declare const ZERO: Decimal;
declare const ONE: Decimal;
declare const ONE_HUNDRED: Decimal;
declare const PRECISE_ZERO: Decimal;
declare const PRECISE_ONE: Decimal;
declare const PRECISE_ONE_HUNDRED: Decimal;
declare function toCamelCase(str: string): string;
declare function findIndexes<T>(arr: T[], predicate: (element: T) => boolean): number[];

export { type BaseEntityState, BaseModel, type BaseNonFungibleData, ComponentState, EntityStateFetcher, EntityStateModel, type EnumTransformerPlugin, type FetchOptions, type FungibleResourceCollectionItem, FungibleResourceCollectionState, type FungibleResourceState, type FungibleVaultState, KeyValueStore, MetadataService, NonFungibleDataModel, type NonFungibleResourceCollectionItem, NonFungibleResourceCollectionState, type NonFungibleResourceState, type NonFungibleVaultState, ONE, ONE_HUNDRED, PRECISE_ONE, PRECISE_ONE_HUNDRED, PRECISE_ZERO, ResourceDetailsRepo, type ResourceState, type TupleTransformerPlugin, ZERO, dec, findIndexes, optionTransformPlugin, toCamelCase };
