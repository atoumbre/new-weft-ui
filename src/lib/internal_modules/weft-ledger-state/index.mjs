// src/api/base-client.ts
import { GatewayApiClient as GatewayClient } from "@radixdlt/babylon-gateway-api-sdk";

// ../state-fetcher/src/owned-entity/component-state.ts
var ComponentState = class {
  constructor(entity, stateFetcher) {
    this.initialized = false;
    this.entity = entity;
    this.stateFetcher = stateFetcher;
  }
  async init(ledgerStateSelector) {
    const result = await this.stateFetcher.stateApi.stateEntityDetails({
      stateEntityDetailsRequest: {
        at_ledger_state: ledgerStateSelector,
        addresses: [this.entity]
      }
    });
    this.stateFetcher.apiCallCount++;
    if (result.items.length === 0)
      return;
    const details = result.items[0]?.details;
    if (details?.type !== "Component")
      return;
    const rawState = details.state;
    if (!rawState)
      return;
    const value = await this.stateFetcher.fetchField(rawState);
    this.state = value;
  }
};

// ../state-fetcher/src/utils.ts
import Decimal from "decimal.js";
Decimal.set({ precision: 50, rounding: Decimal.ROUND_DOWN, toExpNeg: -50, toExpPos: 50 });
var dec = (input) => new Decimal(input);
var ZERO = dec(0);
var ONE = dec(1);
var ONE_HUNDRED = dec(100);
var PRECISE_ZERO = dec(0);
var PRECISE_ONE = dec(1);
var PRECISE_ONE_HUNDRED = dec(100);
function toCamelCase(str) {
  return str.split("_").map(
    (word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join("");
}
function findIndexes(arr, predicate) {
  const indexes = [];
  arr.forEach((element, index) => {
    if (predicate(element)) {
      indexes.push(index);
    }
  });
  return indexes;
}

// ../state-fetcher/src/owned-entity/fungible-resource-collection.ts
var FungibleResourceCollectionState = class {
  constructor(entity, stateFetcher) {
    this.values = {};
    this.initialized = false;
    this.entity = entity;
    this.stateFetcher = stateFetcher;
    this.cursor = { cursor: void 0, stateVersion: 0 };
  }
  get hasMore() {
    return !!this.cursor?.cursor;
  }
  get isInitialized() {
    return this.initialized;
  }
  reset() {
    this.values = {};
    this.cursor = { cursor: void 0, stateVersion: 0 };
    this.initialized = false;
  }
  async init({ aggregationLevel, ledgerStateSelector, recursive }) {
    this.reset();
    await this.loadValues({ aggregationLevel, recursive, ledgerStateSelector });
    this.initialized = true;
  }
  setInitialValues({ initialValues }) {
    this.reset();
    if (initialValues.fungible_resources) {
      this.parseValues(initialValues);
    }
    this.initialized = true;
  }
  async loadMore(recursive = false) {
    if (!this.hasMore)
      return;
    await this.loadValues({ recursive });
  }
  getVaultState(vaultAddress) {
    return Object.values(this.values).filter((v) => v.aggregationLevel === "Vault").flatMap((v) => Object.entries(v.vaults)).find(([address]) => address === vaultAddress)?.[1];
  }
  async loadValues({ aggregationLevel, recursive, ledgerStateSelector }) {
    const result = await this.stateFetcher.stateApi.entityFungiblesPage({
      stateEntityFungiblesPageRequest: {
        at_ledger_state: this.cursor?.stateVersion ? { state_version: this.cursor?.stateVersion } : ledgerStateSelector,
        address: this.entity,
        aggregation_level: aggregationLevel,
        cursor: this.cursor?.cursor
      }
    });
    this.stateFetcher.apiCallCount++;
    this.parseValues({ fungible_resources: result, state_version: result.ledger_state.state_version });
    if (recursive && !!this.cursor.cursor) {
      this.loadValues({ aggregationLevel, recursive: true });
    }
  }
  parseValues({ fungible_resources, state_version }) {
    this.cursor = { cursor: fungible_resources?.next_cursor, stateVersion: state_version };
    fungible_resources?.items.forEach((item) => {
      const resourceAddress = item.resource_address;
      if (item.aggregation_level === "Vault") {
        if (this.values[resourceAddress] === void 0) {
          this.values[resourceAddress] = {
            amount: dec(0),
            aggregationLevel: "Vault",
            vaults: {}
          };
        }
        const value = this.values[resourceAddress];
        if (value.aggregationLevel !== "Vault") {
          throw new Error(`Invalid aggregation level: ${value.aggregationLevel}`);
        }
        item.vaults.items.forEach((vault) => {
          const amount = dec(vault.amount);
          value.amount = value.amount.add(amount);
          value.vaults[vault.vault_address] = {
            resourceAddress,
            amount
          };
        });
        this.values[resourceAddress] = value;
      } else {
        this.values[resourceAddress] = {
          amount: dec(item.amount),
          aggregationLevel: "Global"
        };
      }
    });
  }
};

// ../state-fetcher/src/owned-entity/key-value-store.ts
function defaultKeyParser(entryKey, stateFetcher) {
  const res = stateFetcher.fetchField(entryKey.programmatic_json);
  return res;
}
function defaultValueParser(entryValue, stateFetcher) {
  const res = stateFetcher.fetchField(entryValue.programmatic_json);
  return res;
}
var KeyValueStore = class {
  constructor(storeAddress, stateFetcher, defaultValue) {
    this.values = {};
    this.initialized = false;
    this.storeAddress = storeAddress;
    this.stateFetcher = stateFetcher;
    this.defaultValue = defaultValue;
    this.cursor = { cursor: void 0, stateVersion: 0 };
  }
  get hasMore() {
    return !!this.cursor?.cursor;
  }
  get isInitialized() {
    return this.initialized;
  }
  async init(ledgerStateSelector) {
    this.values = {};
    this.cursor = { cursor: void 0, stateVersion: 0 };
    await this.loadValues(ledgerStateSelector);
    this.initialized = true;
  }
  async loadMore() {
    if (!this.hasMore)
      return;
    await this.loadValues();
  }
  getValue(key) {
    return this.values[key] ?? this.defaultValue;
  }
  setDefaultValue(value) {
    this.defaultValue = value;
  }
  async loadValues(ledgerStateSelector) {
    const at_ledger_state = ledgerStateSelector || (this.cursor?.stateVersion ? { state_version: this.cursor?.stateVersion } : ledgerStateSelector);
    const response = await this.stateFetcher.stateApi.keyValueStoreKeys({
      stateKeyValueStoreKeysRequest: {
        key_value_store_address: this.storeAddress,
        cursor: this.cursor?.cursor,
        at_ledger_state
      }
    });
    this.stateFetcher.apiCallCount++;
    this.cursor = {
      cursor: response.next_cursor,
      stateVersion: response.ledger_state.state_version
    };
    const keys = response.items.map((item) => item.key.raw_hex);
    if (keys.length > 0) {
      const response2 = await this.stateFetcher.stateApi.keyValueStoreData({
        stateKeyValueStoreDataRequest: {
          at_ledger_state,
          key_value_store_address: this.storeAddress,
          keys: keys.map((key) => {
            return { key_hex: key };
          })
        }
      });
      this.stateFetcher.apiCallCount++;
      const tasks = response2.entries.map(async (entry) => {
        const [parsed_key, parsed_value] = await Promise.all([
          defaultKeyParser(entry.key, this.stateFetcher),
          defaultValueParser(entry.value, this.stateFetcher)
        ]);
        this.values[parsed_key] = parsed_value;
      });
      await Promise.all(tasks);
    }
  }
};

// ../state-fetcher/src/owned-entity/non-fungible-resource-collection.ts
var NonFungibleResourceCollectionState = class {
  constructor(entity, stateFetcher) {
    this.values = {};
    this.initialized = false;
    this.entity = entity;
    this.stateFetcher = stateFetcher;
    this.cursor = { cursor: void 0, stateVersion: 0 };
    this.initialized = false;
  }
  get hasMore() {
    return !!this.cursor?.cursor;
  }
  get isInitialized() {
    return this.initialized;
  }
  reset() {
    this.values = {};
    this.cursor = { cursor: void 0, stateVersion: 0 };
  }
  async init({ aggregationLevel, ledgerStateSelector, recursive }) {
    this.reset();
    await this.loadValues({ aggregationLevel, recursive, ledgerStateSelector });
    this.initialized = true;
  }
  async setInitialValues({ initialValues }) {
    this.reset();
    this.parseValues(initialValues);
    this.initialized = true;
  }
  async loadMore(recursive = false) {
    if (!this.hasMore)
      return;
    await this.loadValues({ recursive });
  }
  getVaultState(vaultAddress) {
    return Object.values(this.values).filter((v) => v.aggregationLevel === "Vault").flatMap((v) => Object.entries(v.vaults)).find(([address]) => address === vaultAddress)?.[1];
  }
  async loadValues({ aggregationLevel, recursive, ledgerStateSelector }) {
    const result = await this.stateFetcher.stateApi.entityNonFungiblesPage({
      stateEntityNonFungiblesPageRequest: {
        at_ledger_state: this.cursor?.stateVersion ? { state_version: this.cursor?.stateVersion } : ledgerStateSelector,
        aggregation_level: aggregationLevel,
        address: this.entity,
        cursor: this.cursor.cursor,
        opt_ins: {
          non_fungible_include_nfids: true
        }
      }
    });
    this.stateFetcher.apiCallCount++;
    this.parseValues({ non_fungible_resources: result, state_version: result.ledger_state.state_version });
    if (recursive && !!this.cursor.cursor) {
      this.loadValues({ aggregationLevel, recursive: true });
    }
  }
  parseValues({ non_fungible_resources, state_version }) {
    this.cursor = { cursor: non_fungible_resources?.next_cursor, stateVersion: state_version };
    non_fungible_resources?.items.forEach((item) => {
      const resourceAddress = item.resource_address;
      if (item.aggregation_level === "Vault") {
        if (this.values[resourceAddress] === void 0) {
          this.values[resourceAddress] = {
            totalCount: 0,
            ids: [],
            aggregationLevel: "Vault",
            vaults: {}
          };
        }
        const value = this.values[resourceAddress];
        if (value.aggregationLevel !== "Vault") {
          throw new Error(`Invalid aggregation level: ${value.aggregationLevel}`);
        }
        item.vaults.items.forEach((vault) => {
          const totalCount = vault.items?.length ?? 0;
          if (totalCount !== 0) {
            value.totalCount = value.totalCount + totalCount;
            value.ids = value.ids.concat(vault.items ?? []);
            value.vaults[vault.vault_address] = {
              resourceAddress,
              totalCount,
              ids: vault.items ?? []
            };
          }
        });
        if (value.totalCount === 0) {
          delete this.values[resourceAddress];
        } else {
          this.values[resourceAddress] = value;
        }
      } else {
        if (item.amount !== 0) {
          this.values[resourceAddress] = {
            aggregationLevel: "Global",
            totalCount: item.amount
          };
        }
      }
    });
  }
};

// ../state-fetcher/src/state-fetcher.ts
var defaultOptions = {
  loadState: true,
  recursiveFungibleResourceLoading: true,
  recursiveNonFungibleResourceLoading: true,
  loadResourceDetails: false
};
var optionTransformPlugin = {
  enumName: ["Option"],
  parser: (field, fetcher) => {
    if (field.variant_id === "0" || field.variant_name === "None") {
      return void 0;
    }
    const value = field.fields.length === 1 ? fetcher.fetchField(field.fields[0]) : field.fields.map((v) => fetcher.fetchField(v));
    return value;
  }
};
var EntityStateFetcher = class _EntityStateFetcher {
  constructor(gatewayApi, { enumPlugins, tuplePlugins, options } = {}) {
    this.apiCallCount = 0;
    this.enumPlugins = [];
    this.tuplePlugins = [];
    this.resourceStateCache = {};
    this.gatewayApi = gatewayApi;
    this.addEnumPlugin(optionTransformPlugin);
    this.addPlugins({ enumPlugins, tuplePlugins });
    this.options = { ...defaultOptions, ...options };
  }
  get stateApi() {
    return this.gatewayApi.state.innerClient;
  }
  static newBaseState($entityAddress, stateFetcher) {
    return {
      $entityAddress,
      $fungibleResources: new FungibleResourceCollectionState($entityAddress, stateFetcher),
      $nonFungibleResources: new NonFungibleResourceCollectionState($entityAddress, stateFetcher),
      $metadata: {},
      $state: void 0,
      initialized: false
    };
  }
  addPlugins({ enumPlugins, tuplePlugins }) {
    if (enumPlugins)
      this.addEnumPlugin(enumPlugins);
    if (tuplePlugins)
      this.addTuplePlugin(tuplePlugins);
  }
  addEnumPlugin(plugin) {
    if (!Array.isArray(plugin))
      plugin = [plugin];
    this.enumPlugins.push(...plugin);
  }
  addTuplePlugin(plugin) {
    if (!Array.isArray(plugin))
      plugin = [plugin];
    this.tuplePlugins.push(...plugin);
  }
  setOptions(options) {
    this.options = options;
  }
  async fetchEntityState(entityAddressesInput, localFetchOptions = this.options) {
    let returnedStates = [];
    const fetchOptions = { ...this.options, ...localFetchOptions };
    const entityAddresses = [...new Set(entityAddressesInput)];
    const batchSize = 20;
    let batch = [];
    for (let i = 0; i < entityAddresses.length; i += batchSize) {
      batch = entityAddresses.slice(i, i + batchSize);
      const result = await this.stateApi.stateEntityDetails({
        stateEntityDetailsRequest: {
          at_ledger_state: fetchOptions.ledgerStateSelector,
          addresses: batch,
          aggregation_level: "Vault",
          opt_ins: {
            non_fungible_include_nfids: true
          }
        }
      });
      this.apiCallCount++;
      if (result.items.length === 0)
        return [];
      const tasks = result.items.map(async (entity) => {
        const v = _EntityStateFetcher.newBaseState(entity.address, this);
        await Promise.all([
          (async () => {
            if (entity.fungible_resources) {
              v.$fungibleResources.setInitialValues({
                initialValues: { fungible_resources: entity.fungible_resources, state_version: result.ledger_state.state_version }
              });
              if (fetchOptions.recursiveFungibleResourceLoading) {
                await v.$fungibleResources.loadMore(true);
              }
            }
          })(),
          (async () => {
            if (entity.non_fungible_resources) {
              v.$nonFungibleResources.setInitialValues({
                initialValues: { non_fungible_resources: entity.non_fungible_resources, state_version: result.ledger_state.state_version }
              });
              if (fetchOptions.recursiveNonFungibleResourceLoading) {
                await v.$nonFungibleResources.loadMore(true);
              }
            }
          })()
        ]);
        entity.metadata.items.forEach(async (item) => {
          v.$metadata[toCamelCase(item.key)] = item.value.typed?.value ?? item.value.typed?.values;
        });
        if (fetchOptions.loadState) {
          switch (entity.details?.type) {
            case "Component": {
              v.$state = await this.fetchField(entity.details.state);
              break;
            }
            case "FungibleResource":
              v.$state = entity.details;
              break;
            case "NonFungibleResource":
              v.$state = entity.details;
              break;
            case "FungibleVault":
              v.$state = entity.details;
              break;
            case "NonFungibleVault":
              v.$state = entity.details;
              break;
            case "Package":
              v.$state = entity.details;
              break;
            default:
              v.$state = entity.details;
              break;
          }
        }
        v.initialized = true;
        return v;
      });
      const taskResult = await Promise.all(tasks);
      returnedStates = returnedStates.concat(taskResult);
    }
    if (fetchOptions.loadResourceDetails) {
      const resources = returnedStates.map((state) => {
        const resAddress = [];
        Object.entries(state.$fungibleResources.values).forEach(([key, _]) => {
          resAddress.push(key);
        });
        Object.entries(state.$nonFungibleResources.values).forEach(([key, _]) => {
          resAddress.push(key);
        });
        return resAddress;
      }).flat();
      const resourcesStates = await this.fetchResourceState([...new Set(resources)]);
      for (let i = 0; i < returnedStates.length; i++) {
        Object.entries(returnedStates[i].$fungibleResources.values).forEach(([key, _]) => {
          const resState = resourcesStates.find((r) => r.$entityAddress === key);
          if (resState?.$type !== "FungibleResource")
            return;
          returnedStates[i].$fungibleResources.values[key].fungibleDetails = resState;
        });
        Object.entries(returnedStates[i].$nonFungibleResources.values).forEach(([key, _]) => {
          const resState = resourcesStates.find((r) => r.$entityAddress === key);
          if (resState?.$type !== "NonFungibleResource")
            return;
          returnedStates[i].$nonFungibleResources.values[key].nonFungibleDetails = resState;
        });
      }
    }
    return returnedStates;
  }
  async fetchNftData(nonFungibleResourceAddress, nonFungibleLocalIds, fetchOptions) {
    let nftIdCount = nonFungibleLocalIds.length;
    if (nftIdCount === 0)
      return [];
    const fetchedNftData = [];
    const loadedIds = /* @__PURE__ */ new Set();
    while (nftIdCount > 0) {
      const returnedResult = [];
      const nb = Math.min(99, nftIdCount);
      nftIdCount -= nb;
      const idsToLoad = nonFungibleLocalIds.slice(nftIdCount, nftIdCount + nb).filter((id) => !loadedIds.has(id));
      if (idsToLoad.length === 0)
        continue;
      const fetchResult = await this.stateApi.nonFungibleData({
        stateNonFungibleDataRequest: {
          at_ledger_state: fetchOptions?.ledgerStateSelector,
          resource_address: nonFungibleResourceAddress,
          non_fungible_ids: idsToLoad
        }
      });
      this.apiCallCount++;
      if (!fetchResult?.non_fungible_ids)
        return [];
      const tasks = fetchResult.non_fungible_ids.map(async (nftFetchResult) => {
        if (nftFetchResult.data === void 0) {
          return;
        }
        const nftRawData = nftFetchResult.data?.programmatic_json;
        const state = await this.fetchField(nftRawData);
        const res = {
          $entityAddress: nonFungibleResourceAddress,
          $nonFungibleId: nftFetchResult.non_fungible_id,
          $data: state
        };
        returnedResult.push(res);
        loadedIds.add(nftFetchResult.non_fungible_id);
      });
      await Promise.all(tasks);
      if (fetchOptions?.loadLocations ?? false) {
        const locations = await this.stateApi.nonFungibleLocation({
          stateNonFungibleLocationRequest: {
            at_ledger_state: fetchOptions?.ledgerStateSelector,
            resource_address: nonFungibleResourceAddress,
            non_fungible_ids: idsToLoad
          }
        });
        this.apiCallCount++;
        locations.non_fungible_ids.forEach((location) => {
          const indexes = findIndexes(returnedResult, (nftData) => nftData.$nonFungibleId === location.non_fungible_id);
          indexes.forEach((index) => {
            returnedResult[index].$owningVault = location.owning_vault_address;
            returnedResult[index].$owningVaultParent = location.owning_vault_parent_ancestor_address;
            returnedResult[index].$owningVaultAncestor = location.owning_vault_global_ancestor_address;
          });
        });
      }
      returnedResult.forEach((nftData) => {
        fetchedNftData.push(nftData);
      });
    }
    return fetchedNftData;
  }
  async fetchResourceState(entityAddressesInput, fetchOptions) {
    let returnedStates = [];
    const entityAddresses = [...new Set(entityAddressesInput)];
    const batchSize = 20;
    let batch = [];
    for (let i = 0; i < entityAddresses.length; i += batchSize) {
      batch = entityAddresses.slice(i, i + batchSize);
      const result = await this.stateApi.stateEntityDetails({
        stateEntityDetailsRequest: {
          at_ledger_state: fetchOptions?.ledgerStateSelector,
          addresses: batch,
          aggregation_level: "Global",
          opt_ins: {
            native_resource_details: true
          }
        }
      });
      this.apiCallCount++;
      if (result.items.length === 0)
        return [];
      const tasks = result.items.map(async (resourceState) => {
        let v;
        if (resourceState.details?.type === "FungibleResource") {
          v = {
            $type: resourceState.details?.type,
            $entityAddress: resourceState.address,
            $metadata: {},
            $details: resourceState.details
          };
        }
        if (resourceState.details?.type === "NonFungibleResource") {
          v = {
            $type: resourceState.details?.type,
            $entityAddress: resourceState.address,
            $metadata: {},
            $details: resourceState.details
          };
        }
        if (v === void 0)
          return;
        this.resourceStateCache[resourceState.address] = v;
        resourceState.metadata.items.forEach(async (item) => {
          v.$metadata[toCamelCase(item.key)] = item.value.typed?.value ?? item.value.typed?.values;
        });
        return v;
      });
      const taskResult = await Promise.all(tasks);
      returnedStates = returnedStates.concat(taskResult.filter((item) => item !== void 0));
    }
    return returnedStates;
  }
  fetchField(field) {
    let value;
    if (field === void 0)
      return value;
    switch (field.kind) {
      case "Reference":
      case "Bool":
      case "String":
      case "NonFungibleLocalId": {
        value = field.value;
        break;
      }
      case "U8":
      case "I8":
      case "U16":
      case "I16":
      case "U32":
      case "I32":
      case "U64":
      case "I64":
      case "U128":
      case "I128": {
        value = Number.parseInt(field.value);
        break;
      }
      case "Decimal": {
        value = dec(field.value);
        break;
      }
      case "PreciseDecimal": {
        value = dec(field.value);
        break;
      }
      case "Map": {
        const tempMap = {};
        field.entries.forEach((entry) => {
          const [key, val] = [this.fetchField(entry.key), this.fetchField(entry.value)];
          tempMap[key] = val;
        });
        value = tempMap;
        break;
      }
      case "Array": {
        const tempArray = [];
        field.elements.forEach((entry) => tempArray.push(this.fetchField(entry)));
        value = tempArray;
        break;
      }
      case "Enum": {
        const enumPlugin = this.enumPlugins.reverse().find((plugin) => {
          if (field.type_name === void 0 || field.type_name === null)
            return void 0;
          else
            return plugin.enumName.includes(field.type_name);
        });
        if (enumPlugin) {
          value = enumPlugin.parser(field, this);
        } else {
          if (field.fields.length > 0) {
            value = {
              variantId: field.variant_id,
              variantName: field.variant_name,
              value: field.fields.length === 1 ? this.fetchField(field.fields[0]) : field.fields.map((v) => this.fetchField(v))
            };
          } else {
            value = { variantId: field.variant_id, variantName: field.variant_name };
          }
        }
        break;
      }
      case "Tuple": {
        if (field.fields.length === 0) {
          value = {};
          break;
        }
        const values = {};
        field.fields.forEach((subField, index) => {
          const key = subField.field_name ? toCamelCase(subField.field_name) : `_unnamedField${index}`;
          values[key] = this.fetchField(subField);
        });
        const tuplePlugin = this.tuplePlugins.reverse().find((plugin) => plugin.tupleName === field.type_name);
        value = tuplePlugin ? tuplePlugin.parser(values, this) : values;
        break;
      }
      case "Own": {
        if (field.type_name === "Vault" || field.type_name === "FungibleVault" || field.type_name === "NonFungibleVault") {
          value = field.value;
        } else if (field.type_name === "KeyValueStore") {
          value = new KeyValueStore(field.value, this);
        } else {
          value = new ComponentState(field.value, this);
        }
        break;
      }
      default: {
        value = field;
        break;
      }
    }
    return value;
  }
};

// src/models/interest-strategy.ts
var InterestStrategy = class {
  constructor(breakPoints = [], description) {
    this.breakPoints = breakPoints;
    this.description = description;
    const maxInterestRate = this.getInterestRate(1);
    this.breakPoints.push({
      usage: dec(1),
      rate: dec(maxInterestRate),
      slop: dec(0)
    });
  }
  getChartPoints(pointCount = 500) {
    return Array.from({ length: pointCount + 1 }, (_, i) => ({
      usage: +(i / pointCount * 100).toFixed(0),
      rate: +(this.getInterestRate(i / pointCount) * 100).toFixed(2)
    }));
  }
  getInterestRate(usage) {
    if (usage < 0 || usage > 1) {
      throw new Error("Usage must be between 0 and 1, inclusive");
    }
    const len = this.breakPoints.length;
    let j = len - 1;
    for (let i = 0; i < len - 1; i++) {
      if (this.breakPoints[i].usage.toNumber() <= usage && usage < this.breakPoints[i + 1].usage.toNumber()) {
        j = i;
        break;
      }
    }
    const breakPoint = this.breakPoints[j];
    const interestRate = breakPoint.rate.toNumber() + (usage - breakPoint.usage.toNumber()) * breakPoint.slop.toNumber();
    return interestRate;
  }
};

// src/lib/fetcher-plugins.ts
var interestStrategyPlugin = {
  tupleName: "InterestStrategy",
  parser: (tupleObject, _fetcher) => {
    const interestStrategy = new InterestStrategy(tupleObject.breakPoints ?? [], tupleObject.description);
    return interestStrategy;
  }
};
var serviceStatusStrategyPlugin = {
  tupleName: "ServiceStatus",
  parser: (tupleObject, _fetcher) => {
    return tupleObject._unnamedField0;
  }
};
var configAndServiceKeyPlugin = {
  enumName: ["LendingServiceKey", "LoanServiceKey", "CollateralServiceKey", "ConfigurationKey"],
  parser: (enumObject, _fetcher) => {
    const keyFirstPart = enumObject.variant_name ?? enumObject.variant_id;
    const keySecondPart = enumObject.fields[0] ? `_${enumObject.fields[0].value}` : "";
    const key = `${keyFirstPart}${keySecondPart}`;
    return key;
  }
};
var servicePlugin = {
  enumName: ["LendingService", "LoanService", "CollateralService", "MarketService"],
  parser: (enumObject, _fetcher) => {
    return enumObject.variant_name;
  }
};

// src/api/base-client.ts
var WeftLedgerStateClient = class _WeftLedgerStateClient {
  constructor(radixGatewayApi, stateFetcher) {
    this.radixGatewayApi = radixGatewayApi;
    this.stateFetcher = stateFetcher;
  }
  static setInstance(radixGatewayApi) {
    if (!this.instance) {
      const defaultApi = radixGatewayApi ?? GatewayClient.initialize({
        basePath: "https://mainnet.radixdlt.com",
        applicationName: "Weft API"
      });
      const stateFetcher = new EntityStateFetcher(defaultApi);
      stateFetcher.addPlugins({
        tuplePlugins: [serviceStatusStrategyPlugin],
        enumPlugins: [configAndServiceKeyPlugin, servicePlugin]
      });
      this.instance = new _WeftLedgerStateClient(defaultApi, stateFetcher);
    }
    return this.instance;
  }
  static getInstance() {
    if (!this.instance) {
      throw new Error("WeftRadixApiService not instantiated");
    }
    return this.instance;
  }
  getFetcher() {
    return this.stateFetcher;
  }
  getGatewayApi() {
    return this.radixGatewayApi;
  }
};

// src/lib/cdp-decoder.ts
function decodeCDP(id, encodedCDP) {
  const cdp = {
    id,
    totalLoanValue: dec(encodedCDP[0].value),
    totalAdjustedLoanValue: dec(encodedCDP[1].value),
    totalCollateralValue: dec(encodedCDP[2].value),
    totalHealthCollateralValue: dec(encodedCDP[3].value),
    totalLiquidationCollateralValue: dec(encodedCDP[4].value),
    collateralIsolationGroups: [],
    loanExcludedIsolationGroups: [],
    healthLtv: dec(encodedCDP[7].value),
    liquidationLtv: dec(encodedCDP[8].value),
    discountedNftCollateralValue: dec(encodedCDP[9].value),
    discountedCollateralValue: dec(encodedCDP[10].value),
    loanPositions: {},
    collateralPositions: {},
    nftCollateralPositions: {}
  };
  const loans = {};
  encodedCDP[11].entries.forEach((loan) => {
    const loanData = loan.value.fields;
    loans[loan.key.value] = {
      price: dec(loanData[0].value),
      units: dec(loanData[1].value),
      amount: dec(loanData[2].value),
      value: dec(loanData[3].value),
      adjustedValue: dec(loanData[4].value),
      config: {
        description: loanData[5].fields[0].value,
        loanValueFactor: dec(loanData[5].fields[1].value),
        loanCloseFactor: dec(loanData[5].fields[2].value)
      },
      configVersion: Number.parseInt(loanData[6].value),
      resourceConfig: {
        loanConfigId: Number.parseInt(loanData[7].fields[0].value),
        excludedIsolationGroupIds: [],
        efficiencyGroupId: loanData[7].fields[2].variant_id === "0" ? void 0 : Number.parseInt(loanData[7].fields[2].fields[0].value)
      }
    };
  });
  cdp.loanPositions = loans;
  const collaterals = {};
  encodedCDP[12].entries.forEach((collateral) => {
    const collateralData = collateral.value.fields;
    collaterals[collateral.key.value] = {
      price: dec(collateralData[0].value),
      amount: dec(collateralData[1].value),
      value: dec(collateralData[2].value),
      healthValue: dec(collateralData[3].value),
      liquidationValue: dec(collateralData[4].value),
      discountedValue: dec(collateralData[5].value),
      config: {
        description: collateralData[6].fields[0].value,
        loanToValueRatio: dec(collateralData[6].fields[1].value),
        liquidationThresholdSpread: dec(collateralData[6].fields[2].value),
        liquidationBonusRate: dec(collateralData[6].fields[3].value)
      },
      configVersion: {
        entryVersion: Number.parseInt(collateralData[7].fields[0].value),
        efficiencyMode: {
          variantId: collateralData[7].fields[1].variant_id,
          efficiencyGroupId: collateralData[7].fields[1].variant_id !== "1" ? void 0 : Number.parseInt(collateralData[7].fields[1].fields[0].value)
        }
      },
      resourceConfig: {
        collateralConfigId: Number.parseInt(collateralData[8].fields[0].value),
        isolationGroupId: void 0,
        efficiencyGroupIds: collateralData[8].fields[2].elements.map((e) => Number.parseInt(e.value))
      },
      isFromNft: false,
      resourceType: collateralData[10].variant_id === "0" ? { variantName: "RegisteredToken" } : collateralData[10].variant_id === "1" ? { variantName: "LSU", value: collateralData[10].fields[0].value } : { variantName: "DepositUnit", value: collateralData[10].fields[0].value }
    };
  });
  cdp.collateralPositions = collaterals;
  const nftCollaterals = {};
  encodedCDP[13].entries.forEach((nftCollateral) => {
    const nft_res_address = nftCollateral.key.value;
    const nft_entries = nftCollateral.value.entries;
    nft_entries.forEach((underlyingCollateral) => {
      const nft_id = underlyingCollateral.key.value;
      const nftCollateralData = underlyingCollateral.value.fields;
      const underlyingResources = {};
      nftCollateralData[0].entries.forEach((collateral) => {
        const collateralData = collateral.value.fields;
        underlyingResources[collateral.key.value] = {
          price: dec(collateralData[0].value),
          amount: dec(collateralData[1].value),
          value: dec(collateralData[2].value),
          healthValue: dec(collateralData[3].value),
          liquidationValue: dec(collateralData[4].value),
          discountedValue: dec(collateralData[5].value),
          config: {
            description: collateralData[6].fields[0].value,
            loanToValueRatio: dec(collateralData[6].fields[1].value),
            liquidationThresholdSpread: dec(collateralData[6].fields[2].value),
            liquidationBonusRate: dec(collateralData[6].fields[3].value)
          },
          configVersion: {
            entryVersion: Number.parseInt(collateralData[7].fields[0].value),
            efficiencyMode: collateralData[7].fields[1].variant_id
          },
          resourceConfig: {
            collateralConfigId: Number.parseInt(collateralData[8].fields[0].value),
            isolationGroupId: void 0,
            efficiencyGroupIds: collateralData[8].fields[2].elements.map((e) => Number.parseInt(e.value))
          },
          isFromNft: true,
          resourceType: collateralData[10].variant_id === "0" ? { variantName: "RegisteredToken" } : collateralData[10].variant_id === "1" ? { variantName: "LSU", value: collateralData[10].fields[0].value } : { variantName: "DepositUnit", value: collateralData[10].fields[0].value }
        };
      });
      const nftValue = {
        value: dec(nftCollateralData[1].fields[0].value),
        discountedValue: dec(nftCollateralData[1].fields[1].value),
        loanPaymentValue: dec(nftCollateralData[1].fields[2].value),
        compensationValue: dec(nftCollateralData[1].fields[3].value),
        liquidationFee: dec(nftCollateralData[1].fields[4].value),
        resourceType: nftCollateralData[1].fields[5].variant_id === "0" ? { variantName: "RegisteredNFT" } : { variantName: "ClaimNFT", value: nftCollateralData[1].fields[5].fields[0].value }
      };
      const nFTCollateralPositionData = {
        underlyingPositions: underlyingResources,
        value: nftValue,
        maxAllowedDiscountedValue: dec(nftCollateralData[2].value)
      };
      nftCollaterals[`${nft_res_address}:${nft_id}`] = nFTCollateralPositionData;
    });
  });
  cdp.nftCollateralPositions = nftCollaterals;
  return cdp;
}

// src/lib/const.ts
var LENDING_POOL_COMPONENT = "component_rdx1czmr02yl4da709ceftnm9dnmag7rthu0tu78wmtsn5us9j02d9d0xn";
var LENDING_MARKET_COMPONENT = "component_rdx1cpy6putj5p7937clqgcgutza7k53zpha039n9u5hkk0ahh4stdmq4w";
var WEFT_STAKING_COMPONENT = "component_rdx1cqzle2pft0y09kwzaxy07maczpwmka9xknl88glwc4ka6a7xavsltd";
var LENDING_POOL_INTEREST_STRATEGY_KVS = "internal_keyvaluestore_rdx1krx5aq2h74pdyj99r3rpztr2ahvd9xdtfcfujrm079zw279sse68ck";
var LENDING_POOL_RESOURCE_POOL_KVS = "internal_keyvaluestore_rdx1kzjr763caq96j0kv883vy8gnf3jvrrp7dfm9zr5n0akryvzsxvyujc";
var LENDING_POOL_SERVICE_KVS = "internal_keyvaluestore_rdx1krz350jhmvvuw2cctslmg3axnxagqas4muf5rxvfd8jcqru7s4v9a3";
var LENDING_MARKET_PRICE_CACHE_KVS = "internal_keyvaluestore_rdx1krnvw2lrk6jdhemskgsjldjahq2aatvycpwuuccaap93880hr2s0dh";
var LENDING_MARKET_RES_CONFIG_KVS = "internal_keyvaluestore_rdx1kr89xu06dc83cqvevjs22hg202pkm4xmh5qeka29rc94r2af7vc55n";
var LENDING_MARKET_COLLATERAL_CONFIG_KVS = "internal_keyvaluestore_rdx1krp789s9vy4rny9c6wsm2hs3nxgxxnhafxs2t2lv9qpkdze6rna8qe";
var LENDING_MARKET_LOAN_CONFIG_KVS = "internal_keyvaluestore_rdx1kqhrmxz9dltruje0z2flxy86v9gm58vs38y3kjqxcazhy63z94zmre";
var LENDING_MARKET_EFFICIENT_GROUP_KVS = "internal_keyvaluestore_rdx1kpcw9se76zuryjp2ju7jl3xk9mea32fgj7w83mxq8tx0fgl8a4w7mc";
var LENDING_MARKET_LOAN_SERVICE_KVS = "internal_keyvaluestore_rdx1krqp74wz473l3d7v08m3v66kv46fe03aq5retc7hhy7ha9vgedfha7";
var LENDING_MARKET_COLLATERAL_SERVICE_KVS = "internal_keyvaluestore_rdx1kzsa48ew4vwj7l3y0wdxkkgz6lrrg50lyultllruqzaqawkesf2gre";
var CDP_RESOURCE = "resource_rdx1nt22yfvhuuhxww7jnnml5ec3yt5pkxh0qlghm6f0hz46z2wfk80s9r";
var WEFT_RESOURCE = "resource_rdx1tk3fxrz75ghllrqhyq8e574rkf4lsq2x5a0vegxwlh3defv225cth3";
var XUSDC_RESOURCE = "resource_rdx1t4upr78guuapv5ept7d7ptekk9mqhy605zgms33mcszen8l9fac8vf";
var PROTOCOL_INTEREST_SHARE = 0.2;
var STAKEHOLDER_REWARD_SHARE = 0.5;
var resourceToDuMapping = /* @__PURE__ */ new Map([
  ["resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd", { interestModel: "1", du: "resource_rdx1th0gjs665xgm343j4jee7k8apu8l8pg9cf8x587qprszeeknu8wsxz" }],
  // XRD
  ["resource_rdx1thksg5ng70g9mmy9ne7wz0sc7auzrrwy7fmgcxzel2gvp8pj0xxfmf", { interestModel: "1", du: "resource_rdx1t4p82pms6r20k87rscms728tekujacd0sgxyysk7yvl0jgf56gvjuc" }],
  // LSULP
  ["resource_rdx1t4upr78guuapv5ept7d7ptekk9mqhy605zgms33mcszen8l9fac8vf", { interestModel: "0", du: "resource_rdx1thw2u4uss739j8cqumehgf5wyw26chcfu98newsu42zhln7wd050ee" }],
  // xUSDC
  ["resource_rdx1thrvr3xfs2tarm2dl9emvs26vjqxu6mqvfgvqjne940jv0lnrrg7rw", { interestModel: "0", du: "resource_rdx1t5ljp8amkf76mrn5txmmemkrmjwt5r0ajjnljvyunh27gm0n295dfn" }],
  // xUSDT
  ["resource_rdx1t580qxc7upat7lww4l2c4jckacafjeudxj5wpjrrct0p3e82sq4y75", { interestModel: "2", du: "resource_rdx1thyes252jplxhu8qvfx6k3wkmlhy2f09nfqqefuj2a73l79e0af99t" }],
  // xWBTC
  ["resource_rdx1th88qcj5syl9ghka2g9l7tw497vy5x6zaatyvgfkwcfe8n9jt2npww", { interestModel: "2", du: "resource_rdx1t456hgpk6kwn4lqut5p2mqqmuuwngzhwxlgyyk9dwv4t5hmp37d7xf" }],
  // xETH
  ["resource_rdx1thxj9m87sn5cc9ehgp9qxp6vzeqxtce90xm5cp33373tclyp4et4gv", { interestModel: "0", du: "resource_rdx1t4kxe9n00hgzng02myj6a320qxcma2umxj8ygr795cc5m0hsj3p4l2" }],
  // hUSDC
  ["resource_rdx1th4v03gezwgzkuma6p38lnum8ww8t4ds9nvcrkr2p9ft6kxx3kxvhe", { interestModel: "0", du: "resource_rdx1t48fy4e7d0zfzkky5yxvgaxvewp65ecv49vtccyawlulhegk3sw7kz" }],
  // hUSDT
  ["resource_rdx1t58kkcqdz0mavfz98m98qh9m4jexyl9tacsvlhns6yxs4r6hrm5re5", { interestModel: "2", du: "resource_rdx1t4y98gg8r4mvlaf6tyut0natx874er06qy84ct3d5dvg0c3j2d6d4s" }],
  // hWBTC
  ["resource_rdx1th09yvv7tgsrv708ffsgqjjf2mhy84mscmj5jwu4g670fh3e5zgef0", { interestModel: "2", du: "resource_rdx1t5tcgsd0m6ptqsd0g70xu08tzdhy23ml5ql9xlmmv9wpchg3lw7dtk" }],
  // hETH
  ["resource_rdx1t5ljlq97xfcewcdjxsqld89443fchqg96xv8a8k8gdftdycy9haxpx", { interestModel: "2", du: "resource_rdx1th9rpfyjcuu8w0hypaf4l3ywy26n6nt8hsavuksmjthcyc8unmlccc" }]
  // hSOL
]);
var duToResourceMapping = new Map([...resourceToDuMapping].map(([k, v]) => [v.du, k]));
var defaultLendingPools = [...resourceToDuMapping.keys()];

// src/lib/transaction-utils.ts
function createBaseTransactionParams() {
  return {
    manifest: "",
    start_epoch_inclusive: 1,
    end_epoch_exclusive: 255,
    tip_percentage: 0,
    nonce: 1234567890,
    signer_public_keys: [{
      key_type: "EcdsaSecp256k1",
      key_hex: "02a1b3f9482e376b3e5fd2f48a2c4a679c6cf2c8f7b2dd12c14f75d15df3ac59d1"
      // Random public key
    }],
    flags: {
      use_free_credit: true,
      assume_all_signature_proofs: true,
      skip_epoch_check: true
    },
    opt_ins: {
      radix_engine_toolkit_receipt: true
    }
  };
}

// src/api/cdp-operations.ts
var CdpOperations = class {
  constructor(client) {
    this.client = client;
  }
  async getMultipleCdp(ids, options = {}) {
    const result = await this.cdpRecursiveIndexer(ids, async (ids2) => this.getCdpDataInternal(ids2, options));
    return result;
  }
  async getSingleCdp(id, preManifest) {
    const manifest = `
    ${preManifest}
    CALL_METHOD Address("${LENDING_MARKET_COMPONENT}") "get_cdp" Array<NonFungibleLocalId>(NonFungibleLocalId("${id}"));

    `;
    const response = await this.client.getGatewayApi().transaction.innerClient.transactionPreview({
      transactionPreviewRequest: { ...createBaseTransactionParams(), manifest }
    });
    if (response.receipt.status !== "Succeeded") {
      throw new Error(response.receipt.error_message);
    }
    const outputs = response.receipt.output;
    const receipt = outputs[outputs.length - 1].programmatic_json.entries[0];
    const cdp = decodeCDP(receipt.key.value, receipt.value.fields);
    return cdp;
  }
  async getCdpIds(returnBurntTokens = false) {
    let nonFungibleLocalIds = [];
    let nextCursor;
    let at_ledger_state;
    do {
      const res = await this.client.getGatewayApi().state.innerClient.nonFungibleIds({
        stateNonFungibleIdsRequest: {
          resource_address: CDP_RESOURCE,
          cursor: nextCursor,
          at_ledger_state: at_ledger_state === void 0 ? null : {
            state_version: at_ledger_state
          }
        }
      });
      const locationRes = await this.client.getGatewayApi().state.innerClient.nonFungibleLocation({
        stateNonFungibleLocationRequest: {
          resource_address: CDP_RESOURCE,
          non_fungible_ids: res.non_fungible_ids.items
        }
      });
      nonFungibleLocalIds = nonFungibleLocalIds.concat(
        locationRes.non_fungible_ids.filter((item) => item.is_burned === returnBurntTokens)
      );
      nextCursor = res.non_fungible_ids.next_cursor;
      at_ledger_state = res.ledger_state.state_version;
    } while (nextCursor);
    return nonFungibleLocalIds;
  }
  async getCdpDataInternal(ids, options = {}) {
    const batchedIds = [];
    const cdpPerBatch = options.cdpPerBatch ?? 10;
    for (let i = 0; i < ids.length; i += cdpPerBatch) {
      batchedIds.push(ids.slice(i, i + cdpPerBatch).map((id) => `NonFungibleLocalId("${id}")`));
    }
    const cdps = [];
    const manifests = batchedIds.map(
      (batchedId) => `CALL_METHOD Address("${LENDING_MARKET_COMPONENT}") "get_cdp" Array<NonFungibleLocalId>(${batchedId.join(",")});

`
    );
    const response = await Promise.all(manifests.map(
      (manifest) => this.client.getGatewayApi().transaction.innerClient.transactionPreview({
        transactionPreviewRequest: { ...createBaseTransactionParams(), manifest }
      })
    ));
    const receipts = response.map((r) => {
      if (r.receipt.status !== "Succeeded") {
        throw new Error(r.receipt.error_message);
      }
      return r.receipt.output[0].programmatic_json.entries;
    }).flat();
    receipts.forEach((r) => {
      cdps.push(decodeCDP(r.key.value, r.value.fields));
    });
    if (options.onProgress)
      options.onProgress(cdps.length);
    return cdps;
  }
  async cdpRecursiveIndexer(ids, fetchData) {
    if (ids.length === 0)
      return { data: [], failedIds: [] };
    try {
      const data = await fetchData(ids);
      return { data, failedIds: [] };
    } catch {
      if (ids.length === 1) {
        return { data: [], failedIds: ids };
      }
      const mid = Math.floor(ids.length / 2);
      const [left, right] = await Promise.all([
        this.cdpRecursiveIndexer(ids.slice(0, mid), fetchData),
        this.cdpRecursiveIndexer(ids.slice(mid), fetchData)
      ]);
      const data = [...left.data, ...right.data];
      return {
        data,
        failedIds: [...left.failedIds, ...right.failedIds]
      };
    }
  }
};

// src/api/component-resource-operations.ts
var ComponentResourceOperations = class {
  constructor(client) {
    this.client = client;
  }
  async getResourceInfos(componentAddress, ledgerStateSelector) {
    const allValidatorAddressesSet = /* @__PURE__ */ new Set();
    const lendingMarketComponentStates = await this.client.getFetcher().fetchEntityState(componentAddress, {
      ledgerStateSelector,
      loadResourceDetails: true
    });
    const returnedResult = {};
    const tasks = lendingMarketComponentStates.map(async (lendingMarketComponentState) => {
      if (!lendingMarketComponentState)
        throw new Error("Invalid State");
      const marketState = lendingMarketComponentState.$state;
      if (!marketState)
        throw new Error("Invalid State");
      const fungibleResources = [];
      const lsuResources = [];
      Object.entries(lendingMarketComponentState?.$fungibleResources.values ?? {}).forEach(([address, data]) => {
        if (!data.amount.eq(ZERO)) {
          if (data.fungibleDetails?.$details.native_resource_details?.kind === "ValidatorLiquidStakeUnit") {
            const lsu = {
              resourceAddress: address,
              amount: data.amount,
              unitRedemptionValue: dec(data.fungibleDetails?.$details.native_resource_details?.unit_redemption_value[0]?.amount ?? "0"),
              validatorAddress: data.fungibleDetails?.$details.native_resource_details?.validator_address,
              metadata: data.fungibleDetails?.$metadata,
              validatorMetadata: {}
            };
            lsuResources.push(lsu);
            allValidatorAddressesSet.add(lsu?.validatorAddress);
          } else {
            const fungibleCollateral = {
              resourceAddress: address,
              duReverseAddress: resourceToDuMapping.get(address)?.du,
              duAddress: duToResourceMapping.get(address),
              amount: data.amount,
              metadata: data.fungibleDetails?.$metadata ?? {}
            };
            fungibleResources.push(fungibleCollateral);
          }
        }
      });
      const nonFungibleResources = [];
      const claimNfts = [];
      Object.entries(lendingMarketComponentState?.$nonFungibleResources.values ?? {}).forEach(([address, data]) => {
        const ids = data.ids ?? [];
        if (ids.length === 0) {
          return;
        }
        if (data.nonFungibleDetails?.$details.native_resource_details?.kind === "ValidatorClaimNft") {
          const claimNft = {
            resourceAddress: address,
            ids,
            validatorAddress: data.nonFungibleDetails?.$details.native_resource_details?.validator_address,
            metadata: data.nonFungibleDetails?.$metadata,
            validatorMetadata: {}
          };
          claimNfts.push(claimNft);
          allValidatorAddressesSet.add(claimNft?.validatorAddress);
        } else {
          nonFungibleResources.push({
            resourceAddress: address,
            ids,
            metadata: data.nonFungibleDetails?.$metadata ?? {}
          });
        }
      });
      const res = await this.client.getFetcher().fetchEntityState([...allValidatorAddressesSet], {
        loadState: true,
        loadResourceDetails: false,
        recursiveFungibleResourceLoading: false,
        recursiveNonFungibleResourceLoading: false
      });
      res.forEach((state) => {
        const lsuIndex = lsuResources.findIndex((l) => l.validatorAddress === state.$entityAddress);
        if (lsuIndex > -1) {
          lsuResources[lsuIndex].validatorMetadata = state.$metadata;
        }
        const claimNftIndex = claimNfts.findIndex((l) => l.validatorAddress === state.$entityAddress);
        if (claimNftIndex > -1) {
          claimNfts[claimNftIndex].validatorMetadata = state.$metadata;
        }
      });
      returnedResult[lendingMarketComponentState.$entityAddress] = {
        fungibleResources,
        nonFungibleResources,
        lsuResources,
        claimNfts
      };
    });
    await Promise.all(tasks);
    return returnedResult;
  }
};

// src/api/market-operations.ts
var MarketOperations = class {
  constructor(client, poolOps) {
    this.client = client;
    this.poolOps = poolOps;
  }
  async getMarketInfos(ledgerStateSelector) {
    const resourceConfigs = new KeyValueStore(LENDING_MARKET_RES_CONFIG_KVS, this.client.getFetcher());
    const collateralConfigManagerEntries = new KeyValueStore(LENDING_MARKET_COLLATERAL_CONFIG_KVS, this.client.getFetcher());
    const loanConfigManagerEntries = new KeyValueStore(LENDING_MARKET_LOAN_CONFIG_KVS, this.client.getFetcher());
    const efficiencyGroupManagerEntries = new KeyValueStore(LENDING_MARKET_EFFICIENT_GROUP_KVS, this.client.getFetcher());
    const loanServiceManagerEntries = new KeyValueStore(LENDING_MARKET_LOAN_SERVICE_KVS, this.client.getFetcher());
    const collateralServiceManagerEntries = new KeyValueStore(LENDING_MARKET_COLLATERAL_SERVICE_KVS, this.client.getFetcher());
    const [lendingInfo, lendingMarketComponentStates] = await Promise.all([
      this.poolOps.getPoolInfos(ledgerStateSelector),
      this.client.getFetcher().fetchEntityState([LENDING_MARKET_COMPONENT], { ledgerStateSelector }),
      resourceConfigs.init(ledgerStateSelector),
      collateralConfigManagerEntries.init(ledgerStateSelector),
      loanConfigManagerEntries.init(ledgerStateSelector),
      efficiencyGroupManagerEntries.init(ledgerStateSelector),
      loanServiceManagerEntries.init(ledgerStateSelector),
      collateralServiceManagerEntries.init(ledgerStateSelector)
    ]);
    const lendingMarketComponentState = lendingMarketComponentStates[0];
    if (!lendingMarketComponentState)
      throw new Error("Invalid State");
    const marketState = lendingMarketComponentState.$state;
    if (!marketState)
      throw new Error("Invalid State");
    const loanResources = [];
    const collateralResources = [];
    Object.entries(resourceConfigs.values).forEach(([address, config]) => {
      if (config.loanConfig) {
        const lendingPoolState = lendingInfo.pools.find((pool) => pool.resourceAddress === address);
        loanResources.push({
          resourceAddress: address,
          resourceConfig: config.loanConfig,
          riskConfig: loanConfigManagerEntries.getValue(`Current_${config.loanConfig.loanConfigId}`).entry,
          services: loanServiceManagerEntries.getValue(`Resource_${address}`),
          lendingPoolState
        });
      }
      if (config.collateralConfig) {
        const efficiencyConfigs = {};
        config.collateralConfig.efficiencyGroupIds.forEach((p) => {
          const efficiencyConfig = efficiencyGroupManagerEntries.getValue(`Current_${p}`).entry;
          efficiencyConfigs[`${p}`] = { group: efficiencyConfig, config: collateralConfigManagerEntries.getValue(`Current_${efficiencyConfig.collateralConfigId}`).entry };
        });
        collateralResources.push({
          resourceAddress: address,
          resourceConfig: config.collateralConfig,
          riskConfig: collateralConfigManagerEntries.getValue(`Current_${config.collateralConfig.collateralConfigId}`).entry,
          services: collateralServiceManagerEntries.getValue(`Resource_${address}`),
          efficiencyConfigs
        });
      }
    });
    const globalMarketService = marketState.marketServiceStatus;
    const globalLendingService = lendingInfo.globalLendingService;
    const globalLoanService = loanServiceManagerEntries.getValue(`Global`);
    const globalCollateralService = {
      resource: collateralServiceManagerEntries.getValue(`GlobalResource`),
      lsu: collateralServiceManagerEntries.getValue(`GlobalNFT`),
      nft: collateralServiceManagerEntries.getValue(`GlobalClaimNFT`),
      claimNft: collateralServiceManagerEntries.getValue(`GlobalLSU`)
    };
    const marketConfig = marketState.config;
    const marketFeeConfig = marketState.feeConfig;
    return {
      marketConfig,
      marketFeeConfig,
      loanResources,
      collateralResources,
      globalMarketService,
      globalLendingService,
      globalLoanService,
      globalCollateralService
    };
  }
  async getPrice(resources = defaultLendingPools, ledgerStateSelector) {
    if (ledgerStateSelector)
      return this.getPriceAtLedgerState(resources, ledgerStateSelector);
    else
      return this.getPriceLive(resources);
  }
  async getPriceAtLedgerState(resources = defaultLendingPools, ledgerStateSelector) {
    const kvs = new KeyValueStore(LENDING_MARKET_PRICE_CACHE_KVS, this.client.getFetcher());
    await kvs.init(ledgerStateSelector);
    const price = resources.reduce((acc, resource) => {
      const cachedValue = kvs.getValue(resource);
      if (cachedValue) {
        acc.push({ resourceAddress: resource, price: cachedValue.cachedValue });
      }
      return acc;
    }, []);
    return price;
  }
  async getPriceLive(resources = defaultLendingPools, resourcesPerBatch = 10) {
    const batchedResources = [];
    for (let i = 0; i < resources.length; i += resourcesPerBatch) {
      batchedResources.push(resources.slice(i, i + resourcesPerBatch).map((resource) => `Address("${resource}")`));
    }
    const prices = [];
    const manifests = batchedResources.map(
      (batchedResource) => `CALL_METHOD Address("${LENDING_MARKET_COMPONENT}") "get_price" Array<Address>(${batchedResource.join(",")});

`
    );
    const response = await Promise.all(manifests.map(
      (manifest) => this.client.getGatewayApi().transaction.innerClient.transactionPreview({
        transactionPreviewRequest: { ...createBaseTransactionParams(), manifest }
      })
    ));
    const receipts = response.map((r) => {
      if (r.receipt.status !== "Succeeded") {
        throw new Error(r.receipt.error_message);
      }
      return r.receipt.output[0].programmatic_json.entries;
    }).flat();
    receipts.forEach((r) => {
      prices.push({
        resourceAddress: r.key.value,
        price: dec(r.value.value)
      });
    });
    return prices;
  }
  async getInterestModels(ledgerStateSelector) {
    const kvs = new KeyValueStore(LENDING_POOL_INTEREST_STRATEGY_KVS, this.client.getFetcher());
    await kvs.init(ledgerStateSelector);
    const models = Object.entries(kvs.values).map(([key, value]) => ({
      id: key.replace("Current_", ""),
      model: new InterestStrategy(value.entry.breakPoints ?? [], value.entry.description)
    }));
    return models;
  }
};

// src/api/pool-operations.ts
var PoolOperations = class {
  constructor(client) {
    this.client = client;
  }
  async getPoolInfos(ledgerStateSelector) {
    const lendingServiceKVS = new KeyValueStore(LENDING_POOL_SERVICE_KVS, this.client.getFetcher());
    const [res] = await Promise.all([
      ledgerStateSelector ? this.getResourcePoolAtLedgerState(ledgerStateSelector) : this.getResourcePoolLive(),
      lendingServiceKVS.init(ledgerStateSelector)
    ]);
    res.forEach((poolState, index) => {
      const serviceStatus = lendingServiceKVS.getValue(`Resource_${poolState.resourceAddress}`);
      if (serviceStatus) {
        res[index].serviceStatus = serviceStatus;
      }
    });
    return { pools: res, globalLendingService: lendingServiceKVS.getValue("Global") };
  }
  async getResourcePoolAtLedgerState(ledgerStateSelector) {
    const kvs = new KeyValueStore(LENDING_POOL_RESOURCE_POOL_KVS, this.client.getFetcher());
    await kvs.init(ledgerStateSelector);
    const results = Object.entries(kvs.values)?.map(([res, pooState]) => {
      const totalLoan = pooState.loanState.total;
      const loanUnitRatio = pooState.loanState.unitRatio;
      const totalDeposit = pooState.depositState.total;
      const depositUnitRatio = pooState.depositState.unitRatio;
      const borrowingApr = dec(pooState.interestRate);
      const rawLendingApr = borrowingApr.mul(totalLoan).div(totalDeposit);
      const netLendingApr = rawLendingApr.mul(dec(1).sub(PROTOCOL_INTEREST_SHARE));
      const interestModelId = resourceToDuMapping.get(res)?.interestModel ?? "0";
      const remap = {
        resourceAddress: res,
        depositUnitAddress: resourceToDuMapping.get(res).du,
        totalDeposit,
        totalLoan,
        utilizationRate: totalLoan.div(totalDeposit),
        borrowingApr,
        rawLendingApr,
        netLendingApr,
        depositUnitRatio,
        depositUnitPrice: dec(1).div(depositUnitRatio),
        loanUnitRatio,
        loanUnitPrice: dec(1).div(loanUnitRatio),
        interestModelId,
        config: pooState.poolConfig,
        serviceStatus: void 0
      };
      return remap;
    });
    return results;
  }
  async getResourcePoolLive(resources = defaultLendingPools) {
    const resInput = resources.map((o) => `Address("${o}")`).join(",");
    const manifest = `
    CALL_METHOD Address("${LENDING_POOL_COMPONENT}") "get_pool_state" Array<Address>(${resInput});

    CALL_METHOD Address("${LENDING_POOL_COMPONENT}") "get_pool_config" Array<Address>(${resInput});

    `;
    const res = await this.client.getGatewayApi().transaction.innerClient.transactionPreview({
      transactionPreviewRequest: { ...createBaseTransactionParams(), manifest }
    });
    if (res.receipt.status !== "Succeeded") {
      throw new Error(res.receipt.error_message);
    }
    const stateOutput = res.receipt.output[0].programmatic_json.entries;
    const configOutput = res.receipt.output[1].programmatic_json.entries;
    const result = {};
    if (!stateOutput || !configOutput) {
      throw new Error("Failed to retrieve state");
    }
    for (let i = 0; i < stateOutput.length; i++) {
      const state = stateOutput[i];
      if (state.value.variant_id === 0) {
        continue;
      }
      if (!result[state.key.value]) {
        result[state.key.value] = {
          state: {},
          config: {}
        };
      }
      const res2 = state.key.value;
      result[res2].state = state.value.fields[0];
    }
    for (let i = 0; i < configOutput.length; i++) {
      const config = configOutput[i];
      if (config.key.variant_id === 0) {
        continue;
      }
      if (!result[config.key.value]) {
        result[config.key.value] = {
          state: {},
          config: {}
        };
      }
      const res2 = config.key.value;
      result[res2].config = config.value.fields[0];
    }
    const pools = [];
    for (const [res2, { state, config }] of Object.entries(result)) {
      const poolConfig = {
        interestUpdatePeriod: config.fields[0].value,
        loanFeeRate: config.fields[1].value,
        flashLoanFeeRate: config.fields[2].value,
        depositLimit: config.fields[3].variant_id === "0" ? { variantName: "None" } : config.fields[3].variant_id === "1" ? { variantName: "Amount", value: config.fields[3].fields[0].value } : { variantName: "SupplyRatio", value: config.fields[3].fields[0].value },
        utilizationLimit: config.fields[4].variant_id === "0" ? void 0 : config.fields[4].fields[0].value,
        flashLoanAmountLimit: config.fields[5].variant_id === "0" ? { variantName: "None" } : config.fields[5].variant_id === "1" ? { variantName: "Amount", value: config.fields[5].fields[0].value } : { variantName: "SupplyRatio", value: config.fields[5].fields[0].value }
      };
      const totalLoan = dec(state.fields[2].fields[1].value);
      const loanUnitRatio = dec(state.fields[2].fields[3].value);
      const totalDeposit = dec(state.fields[1].fields[1].value);
      const depositUnitRatio = dec(state.fields[1].fields[3].value);
      const borrowingApr = dec(state.fields[0].value);
      const rawLendingApr = borrowingApr.mul(totalLoan).div(totalDeposit);
      const netLendingApr = rawLendingApr.mul(dec(1).sub(PROTOCOL_INTEREST_SHARE));
      const interestModelId = resourceToDuMapping.get(res2)?.interestModel ?? "0";
      pools.push({
        resourceAddress: res2,
        depositUnitAddress: resourceToDuMapping.get(res2).du,
        totalDeposit,
        totalLoan,
        utilizationRate: totalLoan.div(totalDeposit),
        borrowingApr,
        rawLendingApr,
        netLendingApr,
        depositUnitRatio,
        depositUnitPrice: dec(1).div(depositUnitRatio),
        loanUnitRatio,
        loanUnitPrice: dec(1).div(loanUnitRatio),
        interestModelId,
        config: poolConfig
      });
    }
    return pools;
  }
};

// src/api/weft-staking.ts
var WeftStakingOperations = class {
  constructor(client, marketOps, poolOps) {
    this.client = client;
    this.marketOps = marketOps;
    this.poolOps = poolOps;
  }
  async getWeftStakingApr() {
    const emptyResult = { apr: 0, staked: 0, tvl_xrd: 0, tvl_usd: 0 };
    const [prices, poolStats] = await Promise.all([
      this.marketOps.getPrice([WEFT_RESOURCE, ...defaultLendingPools]),
      this.poolOps.getPoolInfos()
    ]);
    const priceMap = new Map(prices.map((p) => [p.resourceAddress, dec(p.price)]));
    const xusdcPrice = priceMap.get(XUSDC_RESOURCE);
    if (!xusdcPrice)
      return emptyResult;
    let totalLendingDepositsUSD = dec(0);
    let weighedApr = dec(0);
    for (const pool of poolStats.pools) {
      const price = priceMap.get(pool.resourceAddress);
      if (!price)
        continue;
      const depositUSD = dec(pool.totalDeposit).mul(price);
      totalLendingDepositsUSD = totalLendingDepositsUSD.add(depositUSD);
      weighedApr = weighedApr.add(dec(pool.netLendingApr).mul(depositUSD));
    }
    if (totalLendingDepositsUSD.eq(0))
      return emptyResult;
    const averageLendingApr = weighedApr.div(totalLendingDepositsUSD);
    const { items } = await this.client.getGatewayApi().state.innerClient.entityFungiblesPage({
      stateEntityFungiblesPageRequest: { address: WEFT_STAKING_COMPONENT }
    });
    const weftData = items.find((i) => i.resource_address === WEFT_RESOURCE);
    if (!weftData || weftData.aggregation_level !== "Global")
      return emptyResult;
    const stakedWeftAmount = dec(weftData.amount);
    const weftPrice = priceMap.get(WEFT_RESOURCE);
    if (!weftPrice || stakedWeftAmount.eq(0))
      return emptyResult;
    const stakedWeftValueUSD = stakedWeftAmount.mul(weftPrice);
    const stakingApr = averageLendingApr.mul(totalLendingDepositsUSD).mul(PROTOCOL_INTEREST_SHARE).mul(STAKEHOLDER_REWARD_SHARE).div(stakedWeftValueUSD);
    return { apr: stakingApr.toNumber(), staked: stakedWeftAmount.toNumber(), tvl_xrd: stakedWeftValueUSD.toNumber(), tvl_usd: stakedWeftValueUSD.div(xusdcPrice).toNumber() };
  }
};

// src/api/index.ts
var WeftLedgerSateFetcher = class _WeftLedgerSateFetcher {
  constructor(client) {
    this.client = client;
    this.poolOps = new PoolOperations(client);
    this.marketOps = new MarketOperations(client, this.poolOps);
    this.cdpOps = new CdpOperations(client);
    this.stakingOps = new WeftStakingOperations(client, this.marketOps, this.poolOps);
    this.resourceOps = new ComponentResourceOperations(client);
  }
  static setInstance(radixGatewayApi) {
    if (!this.instance) {
      const client = WeftLedgerStateClient.setInstance(radixGatewayApi);
      this.instance = new _WeftLedgerSateFetcher(client);
    }
    return this.instance;
  }
  static getInstance() {
    if (!this.instance) {
      throw new Error("WeftRadixApiService not instantiated");
    }
    return this.instance;
  }
  getFetcher() {
    return this.client.getFetcher();
  }
  getGatewayApi() {
    return this.client.getGatewayApi();
  }
  // Pool Operations
  async getPoolInfos(ledgerStateSelector) {
    return this.poolOps.getPoolInfos(ledgerStateSelector);
  }
  // Market Operations
  async getMarketInfos(ledgerStateSelector) {
    return this.marketOps.getMarketInfos(ledgerStateSelector);
  }
  async getPrice(resources, ledgerStateSelector) {
    return this.marketOps.getPrice(resources, ledgerStateSelector);
  }
  async getInterestModels(ledgerStateSelector) {
    return this.marketOps.getInterestModels(ledgerStateSelector);
  }
  // Resource ops
  async getResourceInfos(componentAddresses, ledgerStateSelector) {
    return this.resourceOps.getResourceInfos(componentAddresses, ledgerStateSelector);
  }
  // CDP Operations
  async getMultipleCdp(ids, options) {
    return this.cdpOps.getMultipleCdp(ids, options);
  }
  async getSingleCdp(id, preManifest) {
    return this.cdpOps.getSingleCdp(id, preManifest);
  }
  async getCdpIds(returnBurntTokens = false) {
    return this.cdpOps.getCdpIds(returnBurntTokens);
  }
  // Weft Staking Operations
  async getWeftStakingApr() {
    return this.stakingOps.getWeftStakingApr();
  }
};
export {
  CDP_RESOURCE,
  CdpOperations,
  ComponentResourceOperations,
  InterestStrategy,
  LENDING_MARKET_COLLATERAL_CONFIG_KVS,
  LENDING_MARKET_COLLATERAL_SERVICE_KVS,
  LENDING_MARKET_COMPONENT,
  LENDING_MARKET_EFFICIENT_GROUP_KVS,
  LENDING_MARKET_LOAN_CONFIG_KVS,
  LENDING_MARKET_LOAN_SERVICE_KVS,
  LENDING_MARKET_PRICE_CACHE_KVS,
  LENDING_MARKET_RES_CONFIG_KVS,
  LENDING_POOL_COMPONENT,
  LENDING_POOL_INTEREST_STRATEGY_KVS,
  LENDING_POOL_RESOURCE_POOL_KVS,
  LENDING_POOL_SERVICE_KVS,
  MarketOperations,
  PROTOCOL_INTEREST_SHARE,
  PoolOperations,
  STAKEHOLDER_REWARD_SHARE,
  WEFT_RESOURCE,
  WEFT_STAKING_COMPONENT,
  WeftLedgerSateFetcher,
  WeftLedgerStateClient,
  WeftStakingOperations,
  XUSDC_RESOURCE,
  configAndServiceKeyPlugin,
  createBaseTransactionParams,
  decodeCDP,
  defaultLendingPools,
  duToResourceMapping,
  interestStrategyPlugin,
  resourceToDuMapping,
  servicePlugin,
  serviceStatusStrategyPlugin
};
