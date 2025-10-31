import { LedgerStateSelector, FungibleResourcesCollection, NonFungibleResourcesCollection, ProgrammaticScryptoSborValueEnum, StateEntityDetailsResponseFungibleResourceDetails, StateEntityDetailsResponseNonFungibleResourceDetails, GatewayApiClient, StateApi, ProgrammaticScryptoSborValue, StateNonFungibleLocationResponseItem, TransactionPreviewRequest } from '@radixdlt/babylon-gateway-api-sdk';
import Decimal from 'decimal.js';

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

interface IsBreakPoint {
    usage: Decimal;
    rate: Decimal;
    slop: Decimal;
}
declare class InterestStrategy {
    description?: string;
    breakPoints: IsBreakPoint[];
    constructor(breakPoints?: IsBreakPoint[], description?: string);
    getChartPoints(pointCount?: number): {
        usage: number;
        rate: number;
    }[];
    getInterestRate(usage: number): number;
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

declare interface OperatingStatusValue {
    enabled: boolean;
    locked: boolean;
}
declare interface ServiceManager<K extends string, S extends string> {
    entries: KeyValueStore<K, Record<S, OperatingStatusValue>>;
}
declare interface ConfigurationEntry<K extends string, T = any> {
    key: K;
    entry: T;
    version: number;
    expirationTime: any;
}
declare interface ConfigurationManager<K extends string, T> {
    entryCount: number;
    trackHistory: boolean;
    entries: KeyValueStore<K, ConfigurationEntry<K, T>>;
    versionCount: number;
}

declare type MarketService = 'CreateCDP' | 'UpdateCDP' | 'BurnCDP';
declare type CollateralService = 'Add' | 'Remove' | 'RemoveForLiquidation' | 'FlashOperation';
declare type LoanService = 'Borrow' | 'Repay' | 'RepayForRefinance' | 'RepayForLiquidation' | 'RepayForNFTLiquidation';
declare type RegisteredResourceType = {
    variantName: 'RegisteredToken';
} | {
    variantName: 'LSU';
    value: string;
} | {
    variantName: 'DepositUnit';
    value: string;
};
declare type RegisteredNFTResourceType = {
    variantName: 'RegisteredNFT';
} | {
    variantName: 'ClaimNFT';
    value: string;
};
declare interface MarketConfig {
    maxCdpPosition: number;
    priceExpirationPeriod: number;
    defaultEfficiencyConfigId?: number | undefined;
}
declare interface MarketProtocolFeeConfig {
    protocolCdpCreationFee: Decimal;
    protocolLiquidationBonusFeeRate: Decimal;
}
declare interface CacheEntry<T> {
    transactionHash: string;
    cachedValue: T;
    timestamp: string;
}
declare interface PriceFeed {
    description: string;
    priceFeedType: string;
}
declare interface LoanConfig {
    description: string;
    loanValueFactor: Decimal;
    loanCloseFactor: Decimal;
}
declare interface CollateralConfig {
    description: string;
    loanToValueRatio: Decimal;
    liquidationThresholdSpread: Decimal;
    liquidationBonusRate: Decimal;
}
declare interface IsolationGroup {
    description: string;
}
declare interface EfficiencyGroup {
    description: string;
    collateralConfigId: number;
}
declare interface NFTCollateralConfig {
    valuatorComponent: string;
    valuatorMethod: string;
    underlyingResources: string[];
}
declare interface LoanResourceConfig {
    loanConfigId: number;
    excludedIsolationGroupIds: number[];
    efficiencyGroupId: number | undefined;
}
declare interface CollateralResourceConfig {
    collateralConfigId: number;
    isolationGroupId: number | undefined;
    efficiencyGroupIds: number[];
}
declare interface ResourceConfig {
    priceFeedId: number;
    loanConfig?: LoanResourceConfig;
    collateralConfig?: CollateralResourceConfig;
}
declare interface LendingPoolProxy {
    lendingPool: string;
    clientBadge: string;
    loanUnitRatioCache: KeyValueStore<string, CacheEntry<Decimal>>;
    depositUnitRatioCache: KeyValueStore<string, CacheEntry<Decimal>>;
}
declare interface LendingMarketState {
    lendingPoolProxy: LendingPoolProxy;
    cdpResManager: string;
    transientResManager: string;
    cdpCounter: number;
    config: MarketConfig;
    feeConfig: MarketProtocolFeeConfig;
    marketServiceStatus: Record<MarketService, OperatingStatusValue>;
    loanServiceManager: ServiceManager<string, LoanService>;
    collateralServiceManager: ServiceManager<string, CollateralService>;
    priceFeedManager: ConfigurationManager<string, PriceFeed>;
    loanConfigManager: ConfigurationManager<string, LoanConfig>;
    collateralConfigManager: ConfigurationManager<string, CollateralConfig>;
    isolationGroupManager: ConfigurationManager<string, IsolationGroup>;
    efficiencyGroupManager: ConfigurationManager<string, EfficiencyGroup>;
    resourceConfigs: KeyValueStore<string, ResourceConfig>;
    nftCollateralResourceConfigs: KeyValueStore<string, NFTCollateralConfig>;
    efficiencyPairs: KeyValueStore<string, number>;
    priceCache: KeyValueStore<string, CacheEntry<Decimal>>;
    resourceTypeCache: KeyValueStore<string, RegisteredResourceType>;
    nftResourceTypeCache: KeyValueStore<string, RegisteredNFTResourceType>;
    collateralAssets: KeyValueStore<string, string>;
    nftCollateralAssets: KeyValueStore<string, string>;
    cdpCreationFees: string;
    liquidationFees: KeyValueStore<string, string>;
    nftLiquidationFees: string;
}

interface EfficiencyMode$1 {
    variantId: string;
    efficiencyGroupId: number | undefined;
}
interface CollateralConfigVersion$1 {
    entryVersion: number;
    efficiencyMode: EfficiencyMode$1;
}
interface CollateralPositionData {
    price: Decimal;
    amount: Decimal;
    value: Decimal;
    healthValue: Decimal;
    liquidationValue: Decimal;
    discountedValue: Decimal;
    config: CollateralConfig;
    configVersion: CollateralConfigVersion$1;
    resourceConfig: CollateralResourceConfig;
    isFromNft: boolean;
    resourceType: RegisteredResourceType;
}
interface LoanPositionData {
    price: Decimal;
    units: Decimal;
    amount: Decimal;
    value: Decimal;
    adjustedValue: Decimal;
    config: LoanConfig;
    configVersion: number;
    resourceConfig: LoanResourceConfig;
}
interface NFTLiquidationValue {
    value: Decimal;
    discountedValue: Decimal;
    loanPaymentValue: Decimal;
    compensationValue: Decimal;
    liquidationFee: Decimal;
    resourceType: RegisteredNFTResourceType;
}
interface NFTCollateralPositionData {
    underlyingPositions: Record<string, CollateralPositionData>;
    value: NFTLiquidationValue;
    maxAllowedDiscountedValue: Decimal;
}
interface CollateralizeDebtPositionData {
    id: string;
    totalLoanValue: Decimal;
    totalAdjustedLoanValue: Decimal;
    totalCollateralValue: Decimal;
    totalHealthCollateralValue: Decimal;
    totalLiquidationCollateralValue: Decimal;
    collateralIsolationGroups: number[];
    loanExcludedIsolationGroups: number[];
    healthLtv: Decimal;
    liquidationLtv: Decimal;
    discountedNftCollateralValue: Decimal;
    discountedCollateralValue: Decimal;
    loanPositions: Record<string, LoanPositionData>;
    collateralPositions: Record<string, CollateralPositionData>;
    nftCollateralPositions: Record<string, NFTCollateralPositionData>;
}

declare type LendingService = 'FlashLoan' | 'Deposit' | 'Withdraw' | 'ProtectedBorrow' | 'ProtectedRepay';
declare type DepositLimitType = {
    variantName: 'None';
} | {
    variantName: 'Amount';
    value: Decimal;
} | {
    variantName: 'SupplyRatio';
    value: Decimal;
};
declare interface LendingPoolProtocolFeeConfig {
    protocolLoanFeeRate: number;
    protocolFlashLoanFeeRate: number;
    protocolInterestFeeRate: number;
}
declare interface ContributionState {
    divisibility: number;
    total: Decimal;
    totalUnits: Decimal;
    unitRatio: Decimal;
}
declare interface ResourcePoolConfig {
    interestUpdatePeriod: number;
    loanFeeRate: Decimal;
    flashLoanFeeRate: Decimal;
    depositLimit: DepositLimitType;
    utilizationLimit: Decimal | undefined;
    flashLoanAmountLimit: DepositLimitType;
}
declare interface ResourcePoolState {
    liquidity: string;
    depositUnitResAddress: string;
    interestRate: number;
    interestUpdatedAt: number;
    pendingProtocolFeeAmount: Decimal;
    depositState: ContributionState;
    loanState: ContributionState;
    interestStrategyId: number;
    poolConfig: ResourcePoolConfig;
}
declare interface LendingPoolState {
    lendingServiceManager: ServiceManager<string, LendingService>;
    transientResManager: string;
    resourcePools: KeyValueStore<string, ResourcePoolState>;
    depositUnitLookup: KeyValueStore<string, any>;
    feeConfig: LendingPoolProtocolFeeConfig;
    interestStrategyManager: ConfigurationManager<string, InterestStrategy>;
    internalAuthBadge: string;
    clientBadgeActivationDelay: number;
    clientBadgeResManager: string;
    clientBadges: string;
}

interface ReturnedResourcePoolState {
    resourceAddress: string;
    depositUnitAddress: string;
    totalDeposit: Decimal;
    totalLoan: Decimal;
    utilizationRate: Decimal;
    borrowingApr: Decimal;
    rawLendingApr: Decimal;
    netLendingApr: Decimal;
    depositUnitRatio: Decimal;
    depositUnitPrice: Decimal;
    loanUnitRatio: Decimal;
    loanUnitPrice: Decimal;
    interestModelId: string;
    config: ResourcePoolConfig;
    serviceStatus?: Record<LendingService, OperatingStatusValue>;
}
interface FetchResult {
    data: CollateralizeDebtPositionData[];
    failedIds: string[];
    callCount?: number;
}
interface GlobalCollateralService {
    resource: Record<CollateralService, OperatingStatusValue>;
    lsu: Record<CollateralService, OperatingStatusValue>;
    nft: Record<CollateralService, OperatingStatusValue>;
    claimNft: Record<CollateralService, OperatingStatusValue>;
}
interface LoanResource {
    resourceAddress: string;
    resourceConfig: LoanResourceConfig;
    riskConfig: LoanConfig;
    services: Record<LoanService, OperatingStatusValue>;
    lendingPoolState?: ReturnedResourcePoolState;
}
interface CollateralResource {
    resourceAddress: string;
    resourceConfig: CollateralResourceConfig;
    riskConfig: CollateralConfig;
    services: Record<CollateralService, OperatingStatusValue>;
    efficiencyConfigs: Record<string, {
        group: EfficiencyGroup;
        config: CollateralConfig;
    }>;
}
interface FungibleResource {
    resourceAddress: string;
    amount: Decimal;
    metadata: Record<string, string>;
    duAddress?: string;
    duReverseAddress?: string;
}
interface LSUResource {
    resourceAddress: string;
    amount: Decimal;
    unitRedemptionValue: Decimal;
    validatorAddress: string;
    metadata: Record<string, string>;
    validatorMetadata: Record<string, string>;
}
interface NonFungibleResource {
    resourceAddress: string;
    ids: string[];
    metadata: Record<string, string>;
}
interface ClaimNFT {
    resourceAddress: string;
    ids: string[];
    validatorAddress: string;
    metadata: Record<string, string>;
    validatorMetadata: Record<string, string>;
}

declare class WeftLedgerStateClient {
    private radixGatewayApi;
    private stateFetcher;
    private static instance;
    private constructor();
    static setInstance(radixGatewayApi?: GatewayApiClient): WeftLedgerStateClient;
    static getInstance(): WeftLedgerStateClient;
    getFetcher(): EntityStateFetcher;
    getGatewayApi(): GatewayApiClient;
}

declare class CdpOperations {
    private client;
    constructor(client: WeftLedgerStateClient);
    getMultipleCdp(ids: string[], options?: {
        cdpPerBatch?: number;
        onProgress?: (fetched: number) => void;
    }): Promise<FetchResult>;
    getSingleCdp(id: string, preManifest: string): Promise<CollateralizeDebtPositionData>;
    getCdpIds(returnBurntTokens?: boolean): Promise<StateNonFungibleLocationResponseItem[]>;
    private getCdpDataInternal;
    private cdpRecursiveIndexer;
}

declare class ComponentResourceOperations {
    private client;
    constructor(client: WeftLedgerStateClient);
    getResourceInfos(componentAddress: string[], ledgerStateSelector?: LedgerStateSelector): Promise<Record<string, {
        fungibleResources: FungibleResource[];
        lsuResources: LSUResource[];
        nonFungibleResources: NonFungibleResource[];
        claimNfts: ClaimNFT[];
    }>>;
}

declare class PoolOperations {
    private client;
    constructor(client: WeftLedgerStateClient);
    getPoolInfos(ledgerStateSelector?: LedgerStateSelector): Promise<{
        pools: ReturnedResourcePoolState[];
        globalLendingService: Record<LendingService, OperatingStatusValue>;
    }>;
    private getResourcePoolAtLedgerState;
    private getResourcePoolLive;
}

declare class MarketOperations {
    private client;
    private poolOps;
    constructor(client: WeftLedgerStateClient, poolOps: PoolOperations);
    getMarketInfos(ledgerStateSelector?: LedgerStateSelector): Promise<{
        loanResources: LoanResource[];
        collateralResources: CollateralResource[];
        marketConfig: MarketConfig;
        marketFeeConfig: MarketProtocolFeeConfig;
        globalMarketService: Record<MarketService, OperatingStatusValue>;
        globalLendingService: Record<LendingService, OperatingStatusValue>;
        globalLoanService: Record<LoanService, OperatingStatusValue>;
        globalCollateralService: GlobalCollateralService;
    }>;
    getPrice(resources?: string[] | undefined, ledgerStateSelector?: LedgerStateSelector): Promise<{
        resourceAddress: string;
        price: Decimal;
    }[]>;
    private getPriceAtLedgerState;
    private getPriceLive;
    getInterestModels(ledgerStateSelector?: LedgerStateSelector): Promise<{
        id: string;
        model: InterestStrategy;
    }[]>;
}

declare class WeftStakingOperations {
    private client;
    private marketOps;
    private poolOps;
    constructor(client: WeftLedgerStateClient, marketOps: MarketOperations, poolOps: PoolOperations);
    getWeftStakingApr(): Promise<{
        apr: number;
        staked: number;
        tvl_xrd: number;
        tvl_usd: number;
    }>;
}

interface WeftRadixApiServiceInterface {
    getPrice: (resources: string[] | undefined, ledgerStateSelector?: LedgerStateSelector | undefined) => Promise<{
        resourceAddress: string;
        price: Decimal;
    }[]>;
    getPoolInfos: (ledgerStateSelector?: LedgerStateSelector) => Promise<{
        pools: ReturnedResourcePoolState[];
        globalLendingService: Record<LendingService, OperatingStatusValue>;
    }>;
    getInterestModels: () => Promise<{
        id: string;
        model: InterestStrategy;
    }[]>;
    getMarketInfos: (edgerStateSelector?: LedgerStateSelector) => Promise<{
        loanResources: LoanResource[];
        collateralResources: CollateralResource[];
        marketConfig: MarketConfig;
        marketFeeConfig: MarketProtocolFeeConfig;
        globalLendingService: Record<LendingService, OperatingStatusValue>;
        globalMarketService: Record<MarketService, OperatingStatusValue>;
        globalLoanService: Record<LoanService, OperatingStatusValue>;
        globalCollateralService: GlobalCollateralService;
    }>;
    getResourceInfos: (componentAddresses: string[], ledgerStateSelector?: LedgerStateSelector) => Promise<Record<string, {
        fungibleResources: FungibleResource[];
        lsuResources: LSUResource[];
        nonFungibleResources: NonFungibleResource[];
        claimNfts: ClaimNFT[];
    }>>;
    getSingleCdp: (id: string, preManifest: string) => Promise<CollateralizeDebtPositionData>;
    getMultipleCdp: (ids: string[], options?: {
        cdpPerBatch?: number;
        onProgress?: (fetched: number) => void;
    }) => Promise<FetchResult>;
    getCdpIds: (returnBurntTokens: boolean) => Promise<StateNonFungibleLocationResponseItem[]>;
    getWeftStakingApr: () => Promise<{
        apr: number;
        staked: number;
        tvl_xrd: number;
        tvl_usd: number;
    }>;
}
declare class WeftLedgerSateFetcher implements WeftRadixApiServiceInterface {
    private client;
    private poolOps;
    private marketOps;
    private cdpOps;
    private stakingOps;
    private resourceOps;
    private constructor();
    private static instance;
    static setInstance(radixGatewayApi?: GatewayApiClient): WeftLedgerSateFetcher;
    static getInstance(): WeftLedgerSateFetcher;
    getFetcher(): EntityStateFetcher;
    getGatewayApi(): GatewayApiClient;
    getPoolInfos(ledgerStateSelector?: LedgerStateSelector): Promise<{
        pools: ReturnedResourcePoolState[];
        globalLendingService: Record<LendingService, OperatingStatusValue>;
    }>;
    getMarketInfos(ledgerStateSelector?: LedgerStateSelector): Promise<{
        loanResources: LoanResource[];
        collateralResources: CollateralResource[];
        marketConfig: MarketConfig;
        marketFeeConfig: MarketProtocolFeeConfig;
        globalMarketService: Record<MarketService, OperatingStatusValue>;
        globalLendingService: Record<LendingService, OperatingStatusValue>;
        globalLoanService: Record<LoanService, OperatingStatusValue>;
        globalCollateralService: GlobalCollateralService;
    }>;
    getPrice(resources?: string[], ledgerStateSelector?: LedgerStateSelector): Promise<{
        resourceAddress: string;
        price: Decimal;
    }[]>;
    getInterestModels(ledgerStateSelector?: LedgerStateSelector): Promise<{
        id: string;
        model: InterestStrategy;
    }[]>;
    getResourceInfos(componentAddresses: string[], ledgerStateSelector?: LedgerStateSelector): Promise<Record<string, {
        fungibleResources: FungibleResource[];
        lsuResources: LSUResource[];
        nonFungibleResources: NonFungibleResource[];
        claimNfts: ClaimNFT[];
    }>>;
    getMultipleCdp(ids: string[], options?: {
        cdpPerBatch?: number;
        onProgress?: (fetched: number) => void;
    }): Promise<FetchResult>;
    getSingleCdp(id: string, preManifest: string): Promise<CollateralizeDebtPositionData>;
    getCdpIds(returnBurntTokens?: boolean): Promise<StateNonFungibleLocationResponseItem[]>;
    getWeftStakingApr(): Promise<{
        apr: number;
        staked: number;
        tvl_xrd: number;
        tvl_usd: number;
    }>;
}

declare function decodeCDP(id: string, encodedCDP: any): CollateralizeDebtPositionData;

declare const LENDING_POOL_COMPONENT = "component_rdx1czmr02yl4da709ceftnm9dnmag7rthu0tu78wmtsn5us9j02d9d0xn";
declare const LENDING_MARKET_COMPONENT = "component_rdx1cpy6putj5p7937clqgcgutza7k53zpha039n9u5hkk0ahh4stdmq4w";
declare const WEFT_STAKING_COMPONENT = "component_rdx1cqzle2pft0y09kwzaxy07maczpwmka9xknl88glwc4ka6a7xavsltd";
declare const LENDING_POOL_INTEREST_STRATEGY_KVS = "internal_keyvaluestore_rdx1krx5aq2h74pdyj99r3rpztr2ahvd9xdtfcfujrm079zw279sse68ck";
declare const LENDING_POOL_RESOURCE_POOL_KVS = "internal_keyvaluestore_rdx1kzjr763caq96j0kv883vy8gnf3jvrrp7dfm9zr5n0akryvzsxvyujc";
declare const LENDING_POOL_SERVICE_KVS = "internal_keyvaluestore_rdx1krz350jhmvvuw2cctslmg3axnxagqas4muf5rxvfd8jcqru7s4v9a3";
declare const LENDING_MARKET_PRICE_CACHE_KVS = "internal_keyvaluestore_rdx1krnvw2lrk6jdhemskgsjldjahq2aatvycpwuuccaap93880hr2s0dh";
declare const LENDING_MARKET_RES_CONFIG_KVS = "internal_keyvaluestore_rdx1kr89xu06dc83cqvevjs22hg202pkm4xmh5qeka29rc94r2af7vc55n";
declare const LENDING_MARKET_COLLATERAL_CONFIG_KVS = "internal_keyvaluestore_rdx1krp789s9vy4rny9c6wsm2hs3nxgxxnhafxs2t2lv9qpkdze6rna8qe";
declare const LENDING_MARKET_LOAN_CONFIG_KVS = "internal_keyvaluestore_rdx1kqhrmxz9dltruje0z2flxy86v9gm58vs38y3kjqxcazhy63z94zmre";
declare const LENDING_MARKET_EFFICIENT_GROUP_KVS = "internal_keyvaluestore_rdx1kpcw9se76zuryjp2ju7jl3xk9mea32fgj7w83mxq8tx0fgl8a4w7mc";
declare const LENDING_MARKET_LOAN_SERVICE_KVS = "internal_keyvaluestore_rdx1krqp74wz473l3d7v08m3v66kv46fe03aq5retc7hhy7ha9vgedfha7";
declare const LENDING_MARKET_COLLATERAL_SERVICE_KVS = "internal_keyvaluestore_rdx1kzsa48ew4vwj7l3y0wdxkkgz6lrrg50lyultllruqzaqawkesf2gre";
declare const CDP_RESOURCE = "resource_rdx1nt22yfvhuuhxww7jnnml5ec3yt5pkxh0qlghm6f0hz46z2wfk80s9r";
declare const WEFT_RESOURCE = "resource_rdx1tk3fxrz75ghllrqhyq8e574rkf4lsq2x5a0vegxwlh3defv225cth3";
declare const XUSDC_RESOURCE = "resource_rdx1t4upr78guuapv5ept7d7ptekk9mqhy605zgms33mcszen8l9fac8vf";
declare const PROTOCOL_INTEREST_SHARE = 0.2;
declare const STAKEHOLDER_REWARD_SHARE = 0.5;
declare const resourceToDuMapping: Map<string, {
    interestModel: string;
    du: string;
}>;
declare const duToResourceMapping: Map<string, string>;
declare const defaultLendingPools: string[];

declare const interestStrategyPlugin: TupleTransformerPlugin<InterestStrategy>;
declare const serviceStatusStrategyPlugin: TupleTransformerPlugin<Record<string, OperatingStatusValue>>;
declare const configAndServiceKeyPlugin: EnumTransformerPlugin<string>;
declare const servicePlugin: EnumTransformerPlugin<string>;

declare function createBaseTransactionParams(): TransactionPreviewRequest;

declare type EfficiencyMode = {
    variantName: 'None';
} | {
    variantName: 'EfficiencyGroup';
    value: number;
} | {
    variantName: 'IdenticalResource';
};
declare interface CollateralConfigVersion {
    entryVersion: number;
    efficiencyMode: EfficiencyMode;
}
declare interface CollateralInfo {
    amount: Decimal;
    configVersion: CollateralConfigVersion;
}
declare interface NFTCollateralInfo {
    nftIds: string[];
    configVersion: Record<string, CollateralConfigVersion>;
}
declare interface LoanInfo {
    units: Decimal;
    configVersion: number;
}
declare interface OnLedgerCdpData {
    id: string;
    mintedAt: number;
    keyImageUrl: string;
    name: string;
    description: string;
    updatedAt: number;
    collaterals: Record<string, CollateralInfo>;
    nftCollaterals: Record<string, NFTCollateralInfo>;
    loans: Record<string, LoanInfo>;
}

export { CDP_RESOURCE, type CacheEntry, CdpOperations, type ClaimNFT, type CollateralConfig, type CollateralConfigVersion, type CollateralInfo, type CollateralPositionData, type CollateralResource, type CollateralResourceConfig, type CollateralService, type CollateralizeDebtPositionData, ComponentResourceOperations, type ConfigurationEntry, type ConfigurationManager, type ContributionState, type DepositLimitType, type EfficiencyGroup, type EfficiencyMode, type FetchResult, type FungibleResource, type GlobalCollateralService, InterestStrategy, type IsBreakPoint, type IsolationGroup, LENDING_MARKET_COLLATERAL_CONFIG_KVS, LENDING_MARKET_COLLATERAL_SERVICE_KVS, LENDING_MARKET_COMPONENT, LENDING_MARKET_EFFICIENT_GROUP_KVS, LENDING_MARKET_LOAN_CONFIG_KVS, LENDING_MARKET_LOAN_SERVICE_KVS, LENDING_MARKET_PRICE_CACHE_KVS, LENDING_MARKET_RES_CONFIG_KVS, LENDING_POOL_COMPONENT, LENDING_POOL_INTEREST_STRATEGY_KVS, LENDING_POOL_RESOURCE_POOL_KVS, LENDING_POOL_SERVICE_KVS, type LSUResource, type LendingMarketState, type LendingPoolProtocolFeeConfig, type LendingPoolProxy, type LendingPoolState, type LendingService, type LoanConfig, type LoanInfo, type LoanPositionData, type LoanResource, type LoanResourceConfig, type LoanService, type MarketConfig, MarketOperations, type MarketProtocolFeeConfig, type MarketService, type NFTCollateralConfig, type NFTCollateralInfo, type NFTCollateralPositionData, type NFTLiquidationValue, type NonFungibleResource, type OnLedgerCdpData, type OperatingStatusValue, PROTOCOL_INTEREST_SHARE, PoolOperations, type PriceFeed, type RegisteredNFTResourceType, type RegisteredResourceType, type ResourceConfig, type ResourcePoolConfig, type ResourcePoolState, type ReturnedResourcePoolState, STAKEHOLDER_REWARD_SHARE, type ServiceManager, WEFT_RESOURCE, WEFT_STAKING_COMPONENT, WeftLedgerSateFetcher, WeftLedgerStateClient, type WeftRadixApiServiceInterface, WeftStakingOperations, XUSDC_RESOURCE, configAndServiceKeyPlugin, createBaseTransactionParams, decodeCDP, defaultLendingPools, duToResourceMapping, interestStrategyPlugin, resourceToDuMapping, servicePlugin, serviceStatusStrategyPlugin };
